import { getToken } from './api';

export interface WsMessage<T = any> {
  event: string;
  watchSpaceId: string;
  payload: T;
  ts: number;
}

export type MessageHandler = (data: WsMessage) => void;

export class WatchSpaceSocket {
  private socket: WebSocket | null = null;
  private spaceId: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pingInterval: any = null;
  private driftMs = 0;
  private onDriftChange?: (drift: number) => void;
  private isIntentionallyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 6;
  private reconnectTimer: any = null;
  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;

  constructor(spaceId: string, onDriftChange?: (drift: number) => void) {
    this.spaceId = spaceId;
    this.onDriftChange = onDriftChange;
  }

  public connect(onOpen?: () => void, onClose?: () => void) {
    if (onOpen) this.onOpenCallback = onOpen;
    if (onClose) this.onCloseCallback = onClose;
    this.isIntentionallyClosed = false;

    const token = getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/watch-spaces/${this.spaceId}?token=${encodeURIComponent(token || '')}`;

    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(`[WS] Connected to Watch Space ${this.spaceId}`);
      this.reconnectAttempts = 0;
      this.startDriftMeasurement();
      if (this.onOpenCallback) this.onOpenCallback();
    };

    this.socket.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.event === 'room.sync.pong') {
          const now = Date.now();
          const sent = msg.payload.clientSentAt;
          const rtt = now - sent;
          // Approximate one-way latency
          this.driftMs = Math.round(rtt / 2);
          if (this.onDriftChange) {
            this.onDriftChange(this.driftMs);
          }
        }
        this.dispatch(msg.event, msg);
        this.dispatch('*', msg);
      } catch (err) {
        console.error('[WS] Error parsing message', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`[WS] Disconnected from Watch Space ${this.spaceId}`, event.reason);
      this.stopDriftMeasurement();
      if (this.onCloseCallback) this.onCloseCallback();

      // Automatic reconnection with exponential backoff
      if (event.reason === 'KICKED') {
        this.isIntentionallyClosed = true; // don't reconnect
      }

      if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
        this.reconnectAttempts++;
        console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.onOpenCallback, this.onCloseCallback);
        }, delay);
      }
    };

    this.socket.onerror = (err) => {
      console.error('[WS] WebSocket error:', err);
    };
  }

  public subscribe(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.unsubscribe(event, handler);
  }

  public unsubscribe(event: string, handler: MessageHandler) {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  private dispatch(event: string, msg: WsMessage) {
    const listeners = this.handlers.get(event);
    if (listeners) {
      listeners.forEach(fn => fn(msg));
    }
  }

  public send(event: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const envelope: WsMessage = {
        event,
        watchSpaceId: this.spaceId,
        payload,
        ts: Date.now()
      };
      this.socket.send(JSON.stringify(envelope));
    }
  }

  // Playback
  public sendPlayback(state: 'play' | 'pause' | 'seek', positionSeconds: number) {
    this.send('room.playback.update', {
      state,
      positionSeconds
    });
  }

  // Chat
  public sendChat(body: string, tsSeconds?: number) {
    this.send('room.chat.message', {
      body,
      tsSeconds: tsSeconds || 0
    });
  }

  public sendTyping() {
    this.send('room.chat.typing', {});
  }

  // Variation voting
  public castVote(variationId: string, optionId: string) {
    this.send('room.variation.vote', {
      variationId,
      optionId
    });
  }

  public openVote(variationId: string, eventId: string, prompt: string, options: any[], durationMs = 15000) {
    this.send('room.variation.voteOpen', {
      variationId,
      eventId,
      prompt,
      options,
      closesAt: Date.now() + durationMs
    });
  }

  public applyVote(variationId: string, winningOptionId: string, label: string) {
    this.send('room.variation.applied', {
      variationId,
      winningOptionId,
      label
    });
  }

  // Moderation
  public sendModMute(userId: string, isMuted: boolean) {
    this.send('room.mod.mute', { userId, isMuted });
  }

  public sendModKick(userId: string) {
    this.send('room.mod.kick', { userId });
  }

  public sendModLock(isLocked: boolean) {
    this.send('room.mod.lock', { isLocked });
  }

  public sendModTransferHost(userId: string) {
    this.send('room.mod.transfer', { userId });
  }

  // Ask AI
  public askAi(currentTs: number, question: string) {
    this.send('room.ai.ask', {
      currentTs,
      question
    });
  }

  private startDriftMeasurement() {
    this.pingInterval = setInterval(() => {
      this.send('room.sync.ping', { clientSentAt: Date.now() });
    }, 4000);
  }

  private stopDriftMeasurement() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopDriftMeasurement();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
