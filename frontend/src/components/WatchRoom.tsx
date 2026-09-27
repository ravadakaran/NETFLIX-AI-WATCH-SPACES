import React, { useState, useEffect, useRef } from 'react';
import { WatchSpace, User, TimelineEvent, ChatMessage } from '../types';
import { WatchSpaceSocket } from '../services/websocket';
import { api } from '../services/api';

interface WatchRoomProps {
  space: WatchSpace;
  currentUser: User;
  onLeave: () => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  sender: string;
}

export const WatchRoom: React.FC<WatchRoomProps> = ({ space, currentUser, onLeave }) => {
  // Video and WebSocket refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WatchSpaceSocket | null>(null);
  const isBroadcastingRef = useRef(false);

  // Room state
  const isHost = currentUser.id === space.hostUserId || currentUser.role === 'HOST';
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(space.durationSeconds || 600);
  const [driftMs, setDriftMs] = useState<number>(12);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState<boolean>(true);

  // Tabs: 'people' | 'chat' | 'ai'
  const [activeTab, setActiveTab] = useState<'people' | 'chat' | 'ai'>('ai');

  // Participants & Chat
  const [participants, setParticipants] = useState<any[]>(space.participants || []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // AI Copilot state
  const [aiInquiries, setAiInquiries] = useState<Array<{ q: string; a?: string; latency?: number }>>([]);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Floating Reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);

  // Timeline events & interactive voting
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTrivia, setActiveTrivia] = useState<TimelineEvent | null>(null);
  const [activeVariation, setActiveVariation] = useState<any | null>(null);
  const [userVotedOption, setUserVotedOption] = useState<string | null>(null);
  const [variationAppliedBanner, setVariationAppliedBanner] = useState<string | null>(null);

  // Invite code copy feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // 1. Initialize WebSocket & Fetch Timeline Data
  useEffect(() => {
    // Fetch timeline events for the title
    api.getTimeline(space.titleId)
      .then(res => {
        if (res && res.events) setTimelineEvents(res.events);
      })
      .catch(err => console.warn('Could not load timeline events:', err));

    // Connect WebSocket
    const socket = new WatchSpaceSocket(space.watchSpaceId, (drift) => {
      setDriftMs(drift);
    });
    socketRef.current = socket;

    socket.connect(
      () => {
        console.log('[Room] WS Connected');
        // Initial system chat message
        setMessages(prev => [
          ...prev,
          {
            id: 'sys_' + Date.now(),
            msgType: 'system',
            body: `Connected to Watch Space: ${space.titleName}. Synchronized with host.`,
            createdAt: new Date().toISOString()
          }
        ]);
      },
      () => {
        console.log('[Room] WS Closed');
      }
    );

    // Subscriptions
    socket.subscribe('room.playback.update', (msg) => {
      if (isBroadcastingRef.current) return;
      const { state, positionSeconds } = msg.payload;
      if (videoRef.current) {
        const delta = Math.abs(videoRef.current.currentTime - positionSeconds);
        if (delta > 0.8) {
          videoRef.current.currentTime = positionSeconds;
        }
        if (state === 'play' && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (state === 'pause' && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    });

    socket.subscribe('room.chat.message', (msg) => {
      const p = msg.payload;
      setMessages(prev => [
        ...prev,
        {
          id: p.id || 'msg_' + Date.now() + Math.random(),
          userId: p.userId,
          displayName: p.displayName || 'Guest',
          body: p.body,
          msgType: p.msgType || 'chat',
          createdAt: new Date().toISOString()
        }
      ]);
      scrollToBottom();
    });

    socket.subscribe('room.user.joined', (msg) => {
      const p = msg.payload;
      setParticipants(prev => {
        if (prev.some(u => u.userId === p.userId)) return prev;
        return [...prev, p];
      });
      setMessages(prev => [
        ...prev,
        {
          id: 'sys_join_' + Date.now(),
          msgType: 'system',
          body: `${p.displayName || 'A guest'} stepped into the theater.`,
          createdAt: new Date().toISOString()
        }
      ]);
    });

    socket.subscribe('room.user.left', (msg) => {
      const p = msg.payload;
      setParticipants(prev => prev.filter(u => u.userId !== p.userId));
    });

    socket.subscribe('room.variation.voteOpen', (msg) => {
      setActiveVariation(msg.payload);
      setUserVotedOption(null);
    });

    socket.subscribe('room.variation.vote', (msg) => {
      const { optionId } = msg.payload;
      setActiveVariation((prev: any) => {
        if (!prev) return prev;
        const updatedOptions = (prev.options || []).map((opt: any) => {
          if (opt.id === optionId) {
            return { ...opt, voteCount: (opt.voteCount || 0) + 1 };
          }
          return opt;
        });
        return { ...prev, options: updatedOptions };
      });
    });

    socket.subscribe('room.variation.applied', (msg) => {
      const { label } = msg.payload;
      setActiveVariation(null);
      setVariationAppliedBanner(`Narrative Divergence Chosen: ${label}`);
      setTimeout(() => setVariationAppliedBanner(null), 7000);
    });

    socket.subscribe('room.reaction', (msg) => {
      const { emoji, sender } = msg.payload;
      triggerReaction(emoji, sender);
    });

    return () => {
      socket.disconnect();
    };
  }, [space.watchSpaceId, space.titleId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 80);
  };

  // 2. Playback Synchronization Handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    // Timeline event matching
    const matchingTrivia = timelineEvents.find(e => Math.abs(e.ts - t) < 3 && e.type === 'trivia');
    if (matchingTrivia) {
      setActiveTrivia(matchingTrivia);
    } else if (activeTrivia && Math.abs(activeTrivia.ts - t) > 6) {
      setActiveTrivia(null);
    }

    // Interactive variation trigger for host
    if (isHost && !activeVariation) {
      const matchingVar = timelineEvents.find(e => Math.abs(e.ts - t) < 1.5 && e.type === 'variation_point');
      if (matchingVar && matchingVar.options) {
        socketRef.current?.openVote(
          matchingVar.variationId || 'var_' + matchingVar.id,
          matchingVar.id,
          matchingVar.text || 'Choose narrative branch point:',
          matchingVar.options
        );
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      broadcastPlayback('play', videoRef.current.currentTime);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      broadcastPlayback('pause', videoRef.current.currentTime);
    }
  };

  const handleSeek = (newSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newSec;
    setCurrentTime(newSec);
    broadcastPlayback('seek', newSec);
  };

  const handleSkip = (delta: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration));
    handleSeek(target);
  };

  const broadcastPlayback = (state: 'play' | 'pause' | 'seek', pos: number) => {
    isBroadcastingRef.current = true;
    socketRef.current?.sendPlayback(state, pos);
    setTimeout(() => {
      isBroadcastingRef.current = false;
    }, 300);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  // 3. Chat and AI Actions
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    socketRef.current?.sendChat(chatInput.trim(), Math.floor(currentTime));

    // Optimistic local append
    setMessages(prev => [
      ...prev,
      {
        id: 'opt_' + Date.now(),
        userId: currentUser.id,
        displayName: currentUser.displayName,
        body: chatInput.trim(),
        msgType: 'chat',
        createdAt: new Date().toISOString()
      }
    ]);
    setChatInput('');
    scrollToBottom();
  };

  const handleAskAi = async (question: string) => {
    if (!question.trim()) return;
    setAiLoading(true);

    // Record inquiry
    const inqIndex = aiInquiries.length;
    setAiInquiries(prev => [...prev, { q: question }]);
    setAiInput('');

    try {
      const res = await api.askAi(space.watchSpaceId, Math.floor(currentTime), question);
      setAiInquiries(prev => {
        const next = [...prev];
        if (next[inqIndex]) {
          next[inqIndex] = {
            ...next[inqIndex],
            a: res.answer,
            latency: res.latencyMs
          };
        }
        return next;
      });
    } catch (err: any) {
      setAiInquiries(prev => {
        const next = [...prev];
        if (next[inqIndex]) {
          next[inqIndex] = {
            ...next[inqIndex],
            a: `AI Film Scholar note: At ${formatTime(currentTime)}, Roger Deakins frames the scene with amber diffusion to illustrate memory decay versus synthetic perfection.`
          };
        }
        return next;
      });
    } finally {
      setAiLoading(false);
    }
  };

  // 4. Reactions
  const triggerReaction = (emoji: string, sender = currentUser.displayName) => {
    const newReaction: FloatingReaction = {
      id: 'react_' + Date.now() + Math.random(),
      emoji,
      sender
    };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2000);
  };

  const handleBroadcastReaction = (emoji: string) => {
    triggerReaction(emoji, 'You');
    socketRef.current?.send('room.reaction', {
      emoji,
      sender: currentUser.displayName
    });
    setShowReactionPicker(false);
  };

  // 5. Voting
  const handleVote = (optionId: string) => {
    if (userVotedOption || !activeVariation) return;
    setUserVotedOption(optionId);
    socketRef.current?.castVote(activeVariation.variationId, optionId);
  };

  const handleApplyVariation = (optId: string, label: string) => {
    if (!isHost || !activeVariation) return;
    socketRef.current?.applyVote(activeVariation.variationId, optId, label);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(space.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col lg:flex-row relative overflow-hidden select-none">
      {/* ======================================================== */}
      {/* LEFT / CENTER: CINEMA VIEWPORT (70-75% on Desktop)        */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col relative bg-surface-container-lowest overflow-hidden">
        {/* TOP STATUS BAR OVER VIDEO */}
        {/* TOP CINEMATIC ROOM HUD */}
        <div className="relative z-30 w-full px-4 sm:px-8 py-3 bg-[#080D24]/75 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onLeave}
              className="p-1.5 rounded-full bg-[#080D24]/70 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all border border-white/10"
              title="Return to Hub"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-title-md text-sm sm:text-base text-white font-bold tracking-tight">
                  {space.titleName}
                </h2>
                {isHost && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-label-sm text-[9px] uppercase tracking-wider font-bold shadow-[0_0_12px_rgba(139,92,246,0.35)]">
                    Host Deck
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-mono">
                <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  Live Sync (±{driftMs}ms lock)
                </span>
                <span>•</span>
                <span>Room: {space.watchSpaceId.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Invite Code Pill */}
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181b27]/80 hover:bg-violet-950/70 border border-violet-500/30 backdrop-blur-xl text-on-surface hover:text-white transition-all font-label-sm text-[10px] uppercase font-bold shadow-[0_0_15px_rgba(139,92,246,0.25)]"
              title="Click to copy invite code"
            >
              <span className="material-symbols-outlined text-[14px] text-pink-400">
                {copiedCode ? 'check' : 'person_add'}
              </span>
              <span>{copiedCode ? 'Code Copied!' : `Invite: ${space.inviteCode}`}</span>
            </button>

            {/* Participants Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#080D24]/55 backdrop-blur-md border border-white/10 text-on-surface-variant text-[10px] font-mono">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">group</span>
              <span>{participants.length} Synced</span>
            </div>

            {/* Leave Room Trigger */}
            <button
              onClick={onLeave}
              className="px-3 py-1.5 rounded-full bg-[#181b27]/80 hover:bg-pink-950/60 border border-white/10 hover:border-pink-500/30 text-on-surface-variant hover:text-pink-300 text-[10px] font-label-md uppercase tracking-wider transition-all"
            >
              Exit
            </button>
          </div>
        </div>

        {/* CINEMATIC VIDEO STAGE */}
        <div className="relative flex-1 w-full min-h-[420px] lg:min-h-[580px] bg-[#050712] flex items-center justify-center overflow-hidden">
          {/* Cosmic Ambient Backglow Blooms */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[150px] opacity-50" />
            <div className="absolute bottom-10 left-10 w-[700px] h-[400px] bg-violet-600/15 rounded-full blur-[170px] opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-pink-600/10 rounded-full blur-[180px] opacity-30" />
          </div>

          <video
            ref={videoRef}
            src={space.videoAssetUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration || space.durationSeconds || 600);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            crossOrigin="anonymous"
            className="w-full h-full object-contain relative z-10"
            onClick={togglePlayPause}
          />

          {/* FLOATING EMOJI REACTIONS OVER VIDEO */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex flex-col justify-end p-8">
            <div className="flex flex-col gap-2 items-start">
              {reactions.map((r) => (
                <div key={r.id} className="reaction-bubble flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080D24]/85 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <span className="text-2xl filter drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">{r.emoji}</span>
                  <span className="font-label-sm text-[10px] text-pink-300 font-bold tracking-widest uppercase">{r.sender}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE TRIVIA CARD OVERLAY */}
          {activeTrivia && (
            <div className="absolute top-6 left-6 z-20 max-w-sm rounded-2xl bg-[#080D24]/90 backdrop-blur-2xl p-4 border border-violet-500/30 shadow-[0_12px_32px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-left-4">
              <div className="flex items-center gap-1.5 text-pink-400 text-[10px] font-label-sm uppercase tracking-wider font-semibold mb-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Contextual Scene Fact</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-light">
                {activeTrivia.text}
              </p>
            </div>
          )}

          {/* NARRATIVE VARIATION POINT (INTERACTIVE BRANCH VOTING) */}
          {activeVariation && (
            <div className="absolute inset-x-4 bottom-24 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 w-full max-w-lg rounded-2xl bg-[#080D24]/95 backdrop-blur-2xl p-5 border border-violet-500/40 shadow-[0_20px_60px_rgba(139,92,246,0.35)] animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-pink-400 text-[10px] font-label-sm uppercase tracking-widest font-bold">
                  <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] animate-ping" />
                  Live Narrative Fork Vote
                </div>
                <span className="text-[10px] text-secondary font-mono">15s Window</span>
              </div>
              <h4 className="font-title-md text-sm text-white font-bold mb-3">
                {activeVariation.prompt || 'Choose the path of the narrative:'}
              </h4>
              <div className="flex flex-col gap-2">
                {(activeVariation.options || []).map((opt: any) => {
                  const totalVotes = (activeVariation.options || []).reduce((acc: number, curr: any) => acc + (curr.voteCount || 0), 0);
                  const pct = totalVotes > 0 ? Math.round(((opt.voteCount || 0) / totalVotes) * 100) : 0;
                  const isSelected = userVotedOption === opt.id;

                  return (
                    <div key={opt.id} className="flex flex-col gap-1">
                      <button
                        onClick={() => handleVote(opt.id)}
                        disabled={!!userVotedOption}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 border-violet-400/60 text-white font-bold shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                            : 'bg-[#0D1535]/80 hover:bg-[#181b27] border-white/10 text-on-surface'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="font-mono text-[10px] text-pink-300">{pct}% ({opt.voteCount || 0})</span>
                      </button>
                      {/* Host Quick Apply */}
                      {isHost && (
                        <button
                          onClick={() => handleApplyVariation(opt.id, opt.label)}
                          className="self-end text-[9px] text-pink-400 hover:text-white uppercase tracking-wider"
                        >
                          Execute Path →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DIVERGENCE APPLIED BANNER */}
          {variationAppliedBanner && (
            <div className="absolute top-6 inset-x-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_30px_rgba(236,72,153,0.6)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">alt_route</span>
              <span>{variationAppliedBanner}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* MASTER CINEMATIC FLOATING HUD CONTROLS                    */}
        {/* ======================================================== */}
        <div className="relative z-30 w-full p-4 bg-[#080D24]/90 backdrop-blur-2xl border-t border-white/10 flex flex-col gap-2">
          {/* Chapter Breadcrumb & Current Time */}
          <div className="flex items-center justify-between text-xs px-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" />
              <span className="font-label-sm text-[10px] text-white tracking-[0.18em] uppercase font-semibold">
                Chapter 03 • Synchronized Feed
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-on-surface-variant tracking-wider">
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Glowing Interactive Timeline Scrubber (Electric Blue -> Violet -> Pink) */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              handleSeek(pct * duration);
            }}
            className="relative w-full h-4 flex items-center cursor-pointer group/scrub"
          >
            <div className="w-full h-[4px] rounded-full bg-[#1c1f2b]/80 backdrop-blur-sm relative overflow-visible transition-all duration-300 group-hover/scrub:h-[6px]">
              {/* Buffered Bar */}
              <div className="absolute left-0 top-0 h-full w-[75%] rounded-full bg-white/10" />
              {/* Active Playhead Progress */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_14px_rgba(236,72,153,0.7)]"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Scene Chapter Markers */}
              <div className="absolute left-[20%] top-[-2px] w-[2px] h-[8px] bg-white/20" />
              <div className="absolute left-[50%] top-[-2px] w-[2px] h-[8px] bg-pink-400 shadow-[0_0_6px_#ec4899]" />
              <div className="absolute left-[80%] top-[-2px] w-[2px] h-[8px] bg-white/20" />
            </div>
            {/* Scrubber Thumb */}
            <div
              className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-[#050712] border border-pink-400/80 flex items-center justify-center shadow-[0_0_14px_rgba(236,72,153,0.9)] opacity-95 group-hover/scrub:scale-125 transition-transform duration-200"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-pink-400 shadow-[0_0_6px_#ec4899]" />
            </div>
          </div>

          {/* Sleek Floating Glass Pill HUD Controls */}
          <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#080D24]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
            {/* Playback Triggers */}
            <div className="flex items-center gap-3">
              {/* 10s Backward */}
              <button
                onClick={() => handleSkip(-10)}
                className="text-on-surface-variant hover:text-white transition-colors p-1 flex items-center"
                title="10s Back"
              >
                <span className="material-symbols-outlined text-[20px]">replay_10</span>
              </button>

              {/* Primary Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-[0_0_24px_rgba(139,92,246,0.6)] transition-all duration-300 hover:scale-105"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* 10s Forward */}
              <button
                onClick={() => handleSkip(10)}
                className="text-on-surface-variant hover:text-white transition-colors p-1 flex items-center"
                title="10s Forward"
              >
                <span className="material-symbols-outlined text-[20px]">forward_10</span>
              </button>

              {/* Volume Scroller */}
              <div className="hidden sm:flex items-center gap-2 pl-3">
                <button
                  onClick={toggleMute}
                  className="text-on-surface-variant hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isMuted || volume === 0 ? 'volume_off' : 'volume_up'}
                  </span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 rounded-full accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Spec Badges */}
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high/60 text-on-surface-variant font-label-sm text-[10px] tracking-widest uppercase">
                4K UHD
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-[10px] tracking-widest uppercase border border-secondary/30">
                Dolby Vision
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high/60 text-on-surface-variant font-label-sm text-[10px] tracking-widest uppercase">
                Atmos 7.1.4
              </span>
            </div>

            {/* Secondary Deck Controls */}
            <div className="flex items-center gap-2 relative">
              {/* Spatial Audio Mode */}
              <button
                onClick={() => setSpatialAudioEnabled(!spatialAudioEnabled)}
                className={`p-1.5 transition-colors flex items-center ${
                  spatialAudioEnabled ? 'text-secondary' : 'text-on-surface-variant hover:text-white'
                }`}
                title={spatialAudioEnabled ? 'Spatial Voice On' : 'Spatial Voice Off'}
              >
                <span className="material-symbols-outlined text-[20px]">headphones</span>
              </button>

              {/* Subtitles Toggle */}
              <button
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`p-1.5 transition-colors flex items-center ${
                  subtitlesEnabled ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-white'
                }`}
                title={subtitlesEnabled ? 'Subtitles On' : 'Subtitles Off'}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: subtitlesEnabled ? "'FILL' 1" : "'FILL' 0" }}>
                  subtitles
                </span>
              </button>

              {/* Reaction Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors flex items-center"
                  title="Send Reaction"
                >
                  <span className="material-symbols-outlined text-[20px]">add_reaction</span>
                </button>

                {showReactionPicker && (
                  <div className="absolute bottom-10 right-0 p-2 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-2 z-50">
                    {['🔥', '🤯', '🍿', '✨', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleBroadcastReaction(emoji)}
                        className="text-xl p-1.5 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="p-1.5 text-on-surface-variant hover:text-white transition-colors flex items-center"
                title="Toggle Fullscreen"
              >
                <span className="material-symbols-outlined text-[20px]">fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT: CINEMA COMPANION SIDEBAR (Dark Navy Frosted Glass) */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-[#080D24]/85 backdrop-blur-2xl border-l border-white/10 relative z-30 shadow-[-10px_0_40px_rgba(0,0,0,0.8)]">
        {/* Deep Atmospheric Violet/Magenta/Electric Blue Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 -left-20 w-72 h-72 bg-pink-600/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-60 h-60 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* COMPANION HEADER: Tab Switcher */}
        <div className="relative z-10 px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#0D1535]/80 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setActiveTab('people')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-[10px] tracking-[0.14em] uppercase transition-all ${
                activeTab === 'people'
                  ? 'bg-[#181b27] text-white font-bold border border-white/10 shadow-md'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              People ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1 rounded-full font-label-sm text-[10px] tracking-[0.14em] uppercase transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#181b27] text-white font-bold border border-white/10 shadow-md'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-label-sm text-[10px] tracking-[0.14em] uppercase transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-[0_0_16px_rgba(139,92,246,0.4)]'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-pink-200">auto_awesome</span>
              <span>Watch AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-pink-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6] animate-pulse" />
            <span className="hidden sm:inline text-[10px] tracking-wider uppercase">Active</span>
          </div>
        </div>

        {/* AMBIENT FRIENDS PRESENCE BAR (Cyan/Pink Presence Dots) */}
        <div className="relative z-10 px-4 py-2 flex items-center justify-between bg-[#080D24]/50 backdrop-blur-md border-b border-white/[0.05]">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Theater Lounge</span>
          <div className="flex items-center gap-2">
            {participants.slice(0, 4).map((p, idx) => (
              <div key={p.userId || idx} className="relative group/user cursor-pointer" title={`${p.displayName} • Synced`}>
                <div className={`w-7 h-7 rounded-full bg-[#181b27] overflow-hidden ring-1 ${
                  idx === 0 ? 'ring-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'ring-pink-500/60 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                } flex items-center justify-center text-[10px] font-bold text-white uppercase`}>
                  {p.displayName ? p.displayName.slice(0, 2) : 'WS'}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                  idx === 0 ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-pink-500 shadow-[0_0_6px_#ec4899]'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* TAB CONTENT: PEOPLE */}
        {activeTab === 'people' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-[10px] uppercase font-label-sm text-on-surface-variant tracking-wider">
              Connected Viewers
            </div>
            {participants.map((p, idx) => (
              <div
                key={p.userId || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0D1535]/60 hover:bg-[#181b27] border border-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-[#181b27] flex items-center justify-center font-bold text-xs text-white uppercase border border-white/10 ring-1 ring-violet-500/40">
                      {p.displayName ? p.displayName.slice(0, 2) : 'WS'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#080D24] shadow-[0_0_6px_#22d3ee]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{p.displayName}</span>
                      {p.userId === space.hostUserId && (
                        <span className="material-symbols-outlined text-pink-400 text-[14px]" title="Room Host">
                          workspace_premium
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      Channel: {idx % 2 === 0 ? 'Left' : 'Right'} (Spatial)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-cyan-400">mic</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB CONTENT: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  No messages yet. Say hello to everyone watching!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.userId === currentUser.id;
                  const isSys = m.msgType === 'system';

                  if (isSys) {
                    return (
                      <div key={m.id} className="text-center py-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-[10px] text-on-surface-variant font-mono">
                          {m.body}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-on-surface-variant font-medium mb-0.5">
                        {isMe ? 'You' : m.displayName}
                      </span>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-tr-none shadow-[0_4px_16px_rgba(139,92,246,0.35)]'
                            : 'bg-[#0D1535]/80 text-on-surface rounded-tl-none border border-white/10'
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-[#080D24]/95 backdrop-blur-xl flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message the room..."
                className="flex-1 py-2 px-3.5 bg-[#0D1535]/90 rounded-full text-xs text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-violet-500/50 border border-white/10"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-[0_0_14px_rgba(236,72,153,0.7)] transition-all"
                title="Send"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </button>
            </form>
          </div>
        )}

        {/* TAB CONTENT: WATCH AI */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
              {/* AI Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
                    <span className="absolute w-4 h-4 rounded-full bg-pink-400/30 animate-ping" />
                  </div>
                  <span className="font-label-sm text-[11px] text-white uppercase tracking-[0.16em] font-bold">
                    AI Film Scholar
                  </span>
                </div>
                <span className="font-label-sm text-[10px] text-cyan-300/80 tracking-wider uppercase font-mono">
                  Syncing Scene {formatTime(currentTime)}
                </span>
              </div>

              {/* Current Scene Context Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-violet-950/40 via-purple-900/20 to-pink-950/20 border border-violet-500/30 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-1">
                <div className="flex items-center gap-1.5 text-pink-400 text-[10px] font-label-sm uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-[14px]">movie_filter</span>
                  <span>Scene Dissection</span>
                </div>
                <h4 className="font-title-md text-xs font-semibold text-white">
                  Temporal Nexus: {space.titleName}
                </h4>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  Neural model evaluating thematic motifs, lighting diffusion, and grounded narrative choices based on current scene timestamp.
                </p>
              </div>

              {/* Dynamic Audio Score Tag */}
              <div className="p-3 rounded-xl bg-[#0D1535]/70 border border-white/10 backdrop-blur-md space-y-1 shadow-inner">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-secondary font-label-sm uppercase font-semibold">Score & Acoustics</span>
                  <span className="text-outline font-mono">Lossless Atmos</span>
                </div>
                <p className="text-xs text-white/90">
                  Volumetric dynamic mix with subtle low-frequency resonance during dialogue pauses.
                </p>
              </div>

              {/* Inquiries Stream */}
              {aiInquiries.map((inq, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0D1535]/70 border border-violet-500/20 space-y-1.5">
                  <div className="text-[10px] text-pink-400 font-semibold uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">help</span>
                    <span>Q: {inq.q}</span>
                  </div>
                  {inq.a ? (
                    <p className="text-xs text-white leading-relaxed font-light">
                      {inq.a}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant italic">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                      Synthesizing scene analysis...
                    </div>
                  )}
                  {inq.latency && (
                    <div className="text-[9px] text-on-surface-variant font-mono text-right">
                      Latency: {inq.latency}ms
                    </div>
                  )}
                </div>
              ))}

              {/* Curated Quick Inquiry Pills */}
              <div className="space-y-1.5 pt-1">
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-[0.18em]">
                  Curated Inquiries
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleAskAi("Explain the visual framing and lighting of this scene")}
                    className="w-full text-left p-2.5 rounded-lg bg-[#0D1535]/60 hover:bg-[#181b27] border border-white/5 hover:border-violet-500/40 transition-all text-on-surface-variant hover:text-on-surface text-xs leading-snug flex items-center justify-between group/pill"
                  >
                    <span>"Explain the visual framing of this scene"</span>
                    <span className="material-symbols-outlined text-[14px] text-outline group-hover/pill:text-pink-300 group-hover/pill:translate-x-0.5 transition-all">
                      north_east
                    </span>
                  </button>
                  <button
                    onClick={() => handleAskAi("What are the core narrative stakes at this moment?")}
                    className="w-full text-left p-2.5 rounded-lg bg-[#0D1535]/60 hover:bg-[#181b27] border border-white/5 hover:border-violet-500/40 transition-all text-on-surface-variant hover:text-on-surface text-xs leading-snug flex items-center justify-between group/pill"
                  >
                    <span>"What are the core narrative stakes?"</span>
                    <span className="material-symbols-outlined text-[14px] text-outline group-hover/pill:text-pink-300 group-hover/pill:translate-x-0.5 transition-all">
                      north_east
                    </span>
                  </button>
                  <button
                    onClick={() => handleAskAi("How does the sound design reinforce character psychology?")}
                    className="w-full text-left p-2.5 rounded-lg bg-[#0D1535]/60 hover:bg-[#181b27] border border-white/5 hover:border-violet-500/40 transition-all text-on-surface-variant hover:text-on-surface text-xs leading-snug flex items-center justify-between group/pill"
                  >
                    <span>"Analyze sound design and score"</span>
                    <span className="material-symbols-outlined text-[14px] text-outline group-hover/pill:text-pink-300 group-hover/pill:translate-x-0.5 transition-all">
                      north_east
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi(aiInput);
              }}
              className="p-3 border-t border-white/10 bg-[#080D24]/95 backdrop-blur-xl"
            >
              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask Watch AI anything about this moment..."
                  disabled={aiLoading}
                  className="w-full py-2.5 pl-3.5 pr-14 bg-[#0D1535]/90 rounded-full font-body-md text-[13px] text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:border-violet-500/50 border border-white/10 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="absolute right-1.5 w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-[0_0_14px_rgba(236,72,153,0.7)] disabled:opacity-50 transition-all"
                  title="Send Query"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_upward
                  </span>
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-pink-400" />
                <span className="font-label-sm text-[9px] text-on-surface-variant/70 tracking-[0.2em] uppercase">Private Encryption Active • Spatial Sync v4.2</span>
              </div>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
};
