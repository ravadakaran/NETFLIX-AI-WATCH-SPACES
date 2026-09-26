import React, { useState, useEffect, useRef } from 'react';
import { WatchSpace, Title, TimelineEvent, ChatMessage, User, Analytics } from '../types';
import { WatchSpaceSocket } from '../services/websocket';
import { api } from '../services/api';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Users, 
  Send, Sparkles, HelpCircle, BarChart2, CheckCircle2, MessageSquare, 
  Vote, AlertCircle, ArrowLeft, Clock, Zap, Crown, Flame
} from 'lucide-react';

interface WatchRoomProps {
  space: WatchSpace;
  currentUser: User;
  onLeave: () => void;
}

export const WatchRoom: React.FC<WatchRoomProps> = ({ space, currentUser, onLeave }) => {
  const [currentSpace, setCurrentSpace] = useState<WatchSpace>(space);
  const [isPlaying, setIsPlaying] = useState<boolean>(space.playbackState === 'play');
  const [currentTime, setCurrentTime] = useState<number>(space.positionSeconds || 0);
  const [duration, setDuration] = useState<number>(space.durationSeconds || 600);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [syncDriftMs, setSyncDriftMs] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<'ai' | 'chat' | 'timeline'>('ai');

  // Chat & Presence
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participantCount, setParticipantCount] = useState<number>(space.activeParticipantsCount || 1);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Timeline & Trivia
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTrivia, setActiveTrivia] = useState<TimelineEvent | null>(null);
  const [surfacedEventIds, setSurfacedEventIds] = useState<Set<string>>(new Set());

  // Variation Voting
  const [activeVote, setActiveVote] = useState<{
    variationId: string;
    prompt: string;
    options: { id: string; label: string; count: number }[];
    closesAt: number;
    hasVoted: boolean;
  } | null>(null);
  const [appliedVariation, setAppliedVariation] = useState<string | null>(null);

  // AI Co-Pilot
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnswers, setAiAnswers] = useState<{
    question: string;
    answer: string;
    sourceEvents: string[];
    latencyMs: number;
    ts: number;
  }[]>([]);

  // Analytics Modal
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WatchSpaceSocket | null>(null);
  const isHost = currentSpace.hostUserId === currentUser.id || currentUser.role === 'HOST';
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize WebSocket & Fetch Timeline
  useEffect(() => {
    // Load timeline events
    api.getTimeline(space.titleId).then(res => {
      setTimelineEvents(res.events || []);
    }).catch(err => console.error('Failed to load timeline:', err));

    // Connect WebSocket
    const ws = new WatchSpaceSocket(space.watchSpaceId, (drift) => {
      setSyncDriftMs(drift);
    });
    socketRef.current = ws;

    ws.connect(() => {
      console.log('Connected to space WS');
    });

    // Listeners
    ws.subscribe('room.playback.update', (msg) => {
      const { state, positionSeconds, issuedBy } = msg.payload;
      if (videoRef.current) {
        const localTime = videoRef.current.currentTime;
        const drift = Math.abs(localTime - positionSeconds);

        // Drift correction: if drift > 0.25s (250ms), seek
        if (drift > 0.25) {
          videoRef.current.currentTime = positionSeconds;
        }

        if (state === 'play') {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (state === 'pause') {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    });

    ws.subscribe('room.presence.update', (msg) => {
      const { participantCount } = msg.payload;
      if (participantCount !== undefined) {
        setParticipantCount(participantCount);
      }
    });

    ws.subscribe('room.chat.message', (msg) => {
      setMessages(prev => [...prev, {
        id: msg.payload.messageId || String(Date.now()),
        userId: msg.payload.userId,
        displayName: msg.payload.displayName,
        msgType: 'chat',
        body: msg.payload.body,
        tsSeconds: msg.payload.tsSeconds,
        createdAt: new Date().toLocaleTimeString()
      }]);
    });

    ws.subscribe('room.ai.trivia', (msg) => {
      setActiveTrivia({
        id: msg.payload.eventId || 'tr_live',
        ts: msg.payload.tsSeconds || 0,
        type: 'trivia',
        text: msg.payload.text
      });
      setTimeout(() => setActiveTrivia(null), 8000);
    });

    ws.subscribe('room.ai.answer', (msg) => {
      setAiAnswers(prev => [{
        question: msg.payload.question,
        answer: msg.payload.answer,
        sourceEvents: msg.payload.sourceEvents || [],
        latencyMs: msg.payload.latencyMs || 45,
        ts: Date.now()
      }, ...prev]);
    });

    ws.subscribe('room.variation.voteOpen', (msg) => {
      setActiveVote({
        variationId: msg.payload.variationId,
        prompt: msg.payload.prompt || 'Choose your path for this scene:',
        options: msg.payload.options.map((o: any) => ({ ...o, count: 0 })),
        closesAt: msg.payload.closesAt || Date.now() + 15000,
        hasVoted: false
      });
    });

    ws.subscribe('room.variation.applied', (msg) => {
      setAppliedVariation(msg.payload.label || 'Alternate variation applied!');
      setActiveVote(null);
      setTimeout(() => setAppliedVariation(null), 6000);
    });

    return () => {
      ws.disconnect();
    };
  }, [space.watchSpaceId, space.titleId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Video Time Update & Timeline Markers Trigger
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Host tracks timeline events for trivia & voting triggers
    if (isHost && timelineEvents.length > 0) {
      const roundedTime = Math.floor(time);
      for (const ev of timelineEvents) {
        if (ev.ts === roundedTime && !surfacedEventIds.has(ev.id)) {
          setSurfacedEventIds(prev => new Set(prev).add(ev.id));

          if (ev.type === 'trivia') {
            setActiveTrivia(ev);
            socketRef.current?.send('room.ai.trivia', {
              eventId: ev.id,
              text: ev.text || ev.payload?.text || 'Authored scene trivia event',
              tsSeconds: ev.ts
            });
            setTimeout(() => setActiveTrivia(null), 8000);
          } else if (ev.type === 'variation_point' && ev.options && ev.options.length >= 2) {
            socketRef.current?.openVote(
              ev.variationId || ev.id,
              ev.id,
              ev.payload?.prompt || 'Interactive Story Poll: Select option',
              ev.options.map(o => ({ id: o.id, label: o.label, assetRef: o.assetRef, count: 0 }))
            );
          }
        }
      }
    }
  };

  // Playback Control Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (isHost) {
        socketRef.current?.sendPlayback('pause', videoRef.current.currentTime);
      }
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (isHost) {
        socketRef.current?.sendPlayback('play', videoRef.current.currentTime);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    if (isHost) {
      socketRef.current?.sendPlayback('seek', target);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socketRef.current?.sendChat(chatInput.trim(), currentTime);
      setChatInput('');
    }
  };

  const handleQuickReaction = (emoji: string) => {
    socketRef.current?.sendChat(emoji, currentTime);

    // Floating reaction
    const newEmoji = { id: String(Date.now() + Math.random()), emoji, x: Math.random() * 80 + 10 };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  const handleAskAi = async (questionText?: string) => {
    const q = questionText || aiQuestion;
    if (!q.trim()) return;
    setIsAiLoading(true);
    setAiQuestion('');

    try {
      const res = await api.askAi(space.watchSpaceId, currentTime, q.trim());
      setAiAnswers(prev => [{
        question: q.trim(),
        answer: res.answer,
        sourceEvents: res.sourceEvents || [],
        latencyMs: res.latencyMs || 42,
        ts: Date.now()
      }, ...prev]);
    } catch (err: any) {
      setAiAnswers(prev => [{
        question: q.trim(),
        answer: `AI error: ${err.message || 'Unable to connect to AI engine'}`,
        sourceEvents: [],
        latencyMs: 0,
        ts: Date.now()
      }, ...prev]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVote = (optionId: string) => {
    if (!activeVote || activeVote.hasVoted) return;
    socketRef.current?.castVote(activeVote.variationId, optionId);
    setActiveVote(prev => prev ? ({ ...prev, hasVoted: true }) : null);

    // If host, auto apply after vote or choice
    if (isHost) {
      const opt = activeVote.options.find(o => o.id === optionId);
      setTimeout(() => {
        socketRef.current?.applyVote(activeVote.variationId, optionId, opt ? opt.label : 'Selected branch');
      }, 1500);
    }
  };

  const openAnalytics = async () => {
    try {
      const data = await api.getAnalytics(space.watchSpaceId);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (e) {
      console.error(e);
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', background: '#08080a' }}>
      
      {/* Top Space Bar */}
      <div style={{
        padding: '12px 28px',
        background: 'rgba(14, 14, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onLeave}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem'
            }}
          >
            <ArrowLeft size={16} /> Leave Room
          </button>
          
          <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{space.titleName}</h2>
              <span className="badge-tag" style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', fontSize: '0.7rem' }}>
                4K STREAM
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>Host: <strong style={{ color: 'white' }}>{space.hostDisplayName}</strong></span>
              <span>•</span>
              <span style={{
                background: 'rgba(229, 9, 20, 0.25)',
                border: '1px solid rgba(229, 9, 20, 0.45)',
                color: '#FF4D4D',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 800
              }}>
                Room Code: {space.inviteCode}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Drift & Action Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="sync-badge">
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: syncDriftMs < 50 ? '#00FF66' : '#FFB800',
              display: 'inline-block'
            }} />
            <span>Sync Drift: <strong style={{ color: '#00FF66' }}>{syncDriftMs}ms</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: isHost ? '#FFE259' : '#00F0FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isHost ? <Crown size={14} color="#FFE259" /> : <Zap size={14} color="#00F0FF" />}
              {isHost ? 'Host Authoritative' : 'Auto Drift Correcting'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Users size={16} />
            <span><strong style={{ color: 'white' }}>{participantCount}</strong> viewers</span>
          </div>

          <button
            onClick={openAnalytics}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <BarChart2 size={15} /> Analytics
          </button>
        </div>
      </div>

      {/* Main Content: Player + Right Side Panels */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Video Player Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#000000',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* HTML5 Video */}
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              src={space.videoAssetUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }}
              playsInline
            />

            {/* Floating Reaction Emojis */}
            {floatingEmojis.map((e) => (
              <div
                key={e.id}
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  left: `${e.x}%`,
                  fontSize: '2.5rem',
                  pointerEvents: 'none',
                  animation: 'slideInUp 1.8s ease-out forwards',
                  zIndex: 25
                }}
              >
                {e.emoji}
              </div>
            ))}

            {/* Autonomic Trivia Alert Overlay */}
            {activeTrivia && (
              <div 
                className="animate-slide-up"
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '28px',
                  maxWidth: '440px',
                  background: 'rgba(14, 14, 20, 0.94)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 240, 255, 0.6)',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: '0 12px 40px rgba(0, 240, 255, 0.3)',
                  zIndex: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} color="#00F0FF" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00F0FF', letterSpacing: '0.5px' }}>
                    TIMELINE TRIVIA • {formatSec(activeTrivia.ts)}
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', lineHeight: '1.5', margin: 0, color: '#FFFFFF' }}>
                  {activeTrivia.text || activeTrivia.payload?.text}
                </p>
              </div>
            )}

            {/* Narrative Variation Voting Modal / Overlay */}
            {activeVote && (
              <div
                className="animate-slide-up"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  maxWidth: '540px',
                  background: 'rgba(16, 16, 22, 0.96)',
                  backdropFilter: 'blur(24px)',
                  border: '2px solid var(--primary-red)',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(229, 9, 20, 0.45)',
                  zIndex: 30,
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Vote size={22} color="#E50914" />
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, letterSpacing: '0.5px' }}>ROOM NARRATIVE VOTE</h3>
                </div>
                <p style={{ fontSize: '1rem', color: '#dedede', marginBottom: '22px' }}>
                  {activeVote.prompt}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeVote.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(opt.id)}
                      disabled={activeVote.hasVoted}
                      style={{
                        background: activeVote.hasVoted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(229, 9, 20, 0.25)',
                        border: '1px solid ' + (activeVote.hasVoted ? 'rgba(255,255,255,0.2)' : 'rgba(229, 9, 20, 0.6)'),
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        cursor: activeVote.hasVoted ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{opt.label}</span>
                      {activeVote.hasVoted && <CheckCircle2 size={20} color="#00FF66" />}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '18px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {activeVote.hasVoted ? '✓ Vote recorded! Synchronizing branch decision to all room members...' : 'Vote closes soon • Guide the stream branch!'}
                </div>
              </div>
            )}

            {/* Applied Variation Notification */}
            {appliedVariation && (
              <div 
                className="animate-slide-up"
                style={{
                  position: 'absolute',
                  bottom: '90px',
                  background: 'rgba(0, 240, 255, 0.25)',
                  border: '1px solid #00F0FF',
                  backdropFilter: 'blur(12px)',
                  color: '#FFFFFF',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 0 20px rgba(0,240,255,0.3)',
                  zIndex: 25
                }}
              >
                <Sparkles size={18} color="#00F0FF" />
                <span>Story Branch Active: <strong>{appliedVariation}</strong></span>
              </div>
            )}
          </div>

          {/* Video Control Bar with Timeline Markers */}
          <div style={{
            background: 'linear-gradient(transparent, rgba(10, 10, 14, 0.95))',
            padding: '16px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Scrubber Container with Markers */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isHost}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary-red)',
                  cursor: isHost ? 'pointer' : 'not-allowed',
                  height: '6px',
                  zIndex: 2
                }}
              />

              {/* Render timeline markers on seekbar */}
              {timelineEvents.map((ev) => {
                const pct = duration > 0 ? (ev.ts / duration) * 100 : 0;
                return (
                  <div
                    key={ev.id}
                    title={`${ev.type}: ${ev.text || ev.payload?.name || ev.payload?.prompt || 'Marker'} (${formatSec(ev.ts)})`}
                    style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: ev.type === 'trivia' ? '#00F0FF' : (ev.type === 'variation_point' ? '#FF4D4D' : '#FFE259'),
                      boxShadow: '0 0 6px ' + (ev.type === 'trivia' ? '#00F0FF' : '#FF4D4D'),
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                      zIndex: 3
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  disabled={!isHost}
                  style={{
                    background: isHost ? 'white' : 'rgba(255,255,255,0.4)',
                    color: 'black',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isHost ? 'pointer' : 'not-allowed',
                    boxShadow: '0 0 15px rgba(255,255,255,0.3)'
                  }}
                  title={isHost ? (isPlaying ? 'Pause' : 'Play') : 'Playback locked to Host'}
                >
                  {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                </button>

                {/* Time Display */}
                <span style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'white' }}>{formatSec(currentTime)}</strong> / {formatSec(duration)}
                </span>

                {/* Volume Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                  <button onClick={toggleMute} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{ width: '80px', accentColor: 'var(--primary-red)' }}
                  />
                </div>
              </div>

              {/* Host Control Hint */}
              <div style={{ fontSize: '0.82rem', color: isHost ? '#00F0FF' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isHost ? (
                  <>
                    <Crown size={15} color="#FFE259" />
                    <span>Host Authoritative Control Active</span>
                  </>
                ) : (
                  <span>🔒 Playback synced to Host: <strong>{space.hostDisplayName}</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Side Tabs (AI Co-Pilot | Live Chat | Timeline) */}
        <div style={{
          width: '440px',
          background: 'rgba(14, 14, 18, 0.98)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Sub Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 12px',
            gap: '6px'
          }}>
            <button
              onClick={() => setActiveTab('ai')}
              style={{
                flex: 1,
                background: activeTab === 'ai' ? 'rgba(0, 240, 255, 0.18)' : 'transparent',
                color: activeTab === 'ai' ? '#00F0FF' : 'var(--text-muted)',
                border: activeTab === 'ai' ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={16} /> AI Co-Pilot
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                background: activeTab === 'chat' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: activeTab === 'chat' ? 'white' : 'var(--text-muted)',
                border: activeTab === 'chat' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={16} /> Room Chat
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                flex: 1,
                background: activeTab === 'timeline' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: activeTab === 'timeline' ? 'white' : 'var(--text-muted)',
                border: activeTab === 'timeline' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Clock size={16} /> Timeline
            </button>
          </div>

          {/* Tab 1: AI Co-Pilot */}
          {activeTab === 'ai' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Context Header */}
              <div style={{
                padding: '12px 18px',
                background: 'rgba(0, 240, 255, 0.06)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <span style={{ color: '#00F0FF', fontWeight: 700 }}>Grounded Timeline Intelligence</span>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp: <strong>{formatSec(currentTime)}</strong></span>
              </div>

              {/* Quick Scene Questions */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                  SUGGESTED SCENE QUERIES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    onClick={() => handleAskAi("Who is Detective Rios?")}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '5px 12px',
                      color: 'white',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    👤 Who is Detective Rios?
                  </button>
                  <button
                    onClick={() => handleAskAi("Explain what a Neural Link Cyberdeck is")}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '5px 12px',
                      color: 'white',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    💡 What is a Cyberdeck?
                  </button>
                  <button
                    onClick={() => handleAskAi("Where was this neon scene filmed?")}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '16px',
                      padding: '5px 12px',
                      color: 'white',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    🎬 Filming location trivia
                  </button>
                </div>
              </div>

              {/* AI Answers Stream */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {aiAnswers.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', padding: '24px' }}>
                    <Sparkles size={38} color="#00F0FF" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'white', marginBottom: '6px' }}>
                      Scene-Grounded Copilot
                    </p>
                    <p style={{ fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Ask questions about characters, technology, or lore. Answers cite exact metadata IDs from the authored timeline.
                    </p>
                  </div>
                ) : (
                  aiAnswers.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        borderRadius: '10px',
                        padding: '14px',
                        border: '1px solid rgba(0, 240, 255, 0.3)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF', marginBottom: '6px' }}>
                        Q: {item.question}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#E2E8F0', lineHeight: '1.5', marginBottom: '10px' }}>
                        {item.answer}
                      </div>

                      {/* Source event chips */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Citations:</span>
                          {item.sourceEvents.length > 0 ? (
                            item.sourceEvents.map((eid, eidx) => (
                              <span
                                key={eidx}
                                style={{
                                  background: 'rgba(0, 240, 255, 0.2)',
                                  color: '#00F0FF',
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 800
                                }}
                              >
                                {eid}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#a0a0a0' }}>Authored Timeline</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#00FF66', fontWeight: 600 }}>{item.latencyMs}ms</span>
                      </div>
                    </div>
                  ))
                )}
                {isAiLoading && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 240, 255, 0.08)',
                    color: '#00F0FF',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Sparkles size={16} className="animate-spin" />
                    <span>Analyzing scene timeline metadata...</span>
                  </div>
                )}
              </div>

              {/* AI Input Form */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleAskAi(); }}
                style={{ padding: '14px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '10px' }}
              >
                <input
                  type="text"
                  placeholder="Ask grounded scene question..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  disabled={isAiLoading}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiQuestion.trim()}
                  className="btn-cyber"
                  style={{ padding: '10px 16px' }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Live Room Chat */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Chat Feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.9rem' }}>Welcome to the room! Send a message to chat.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: m.userId === currentUser.id ? 'rgba(229, 9, 20, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                        border: m.userId === currentUser.id ? '1px solid rgba(229, 9, 20, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: m.userId === currentUser.id ? '#FF4D4D' : '#FFFFFF' }}>
                          {m.displayName || 'Viewer'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {m.tsSeconds !== undefined ? formatSec(m.tsSeconds) : m.createdAt}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', margin: 0, wordBreak: 'break-word', color: '#E2E8F0' }}>{m.body}</p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Reactions */}
              <div style={{ display: 'flex', gap: '10px', padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {['🔥', '🤯', '🍿', '👏', '❤️'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      transition: 'transform 0.15s'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChat}
                style={{ padding: '14px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '10px' }}
              >
                <input
                  type="text"
                  placeholder="Chat with watch party..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="btn-netflix"
                  style={{ padding: '10px 16px' }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Timeline Events List */}
          {activeTab === 'timeline' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                Authored Scene Markers ({timelineEvents.length} events indexed)
              </div>
              {timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: Math.abs(currentTime - ev.ts) < 5 ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    border: Math.abs(currentTime - ev.ts) < 5 ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: isHost ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (isHost && videoRef.current) {
                      videoRef.current.currentTime = ev.ts;
                      socketRef.current?.sendPlayback('seek', ev.ts);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: ev.type === 'trivia' ? '#00F0FF' : (ev.type === 'variation_point' ? '#FF4D4D' : '#FFE259')
                    }}>
                      {ev.type}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {formatSec(ev.ts)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0, color: '#E2E8F0', lineHeight: '1.4' }}>
                    {ev.text || ev.payload?.name || ev.payload?.term || ev.payload?.prompt || 'Authored event'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '520px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={22} color="#00F0FF" /> Watch Space Analytics & Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Session Duration</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{formatSec(analytics.sessionDurationSeconds)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Peak Viewers</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{analytics.peakParticipants}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Questions Answered</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00F0FF', marginTop: '4px' }}>{analytics.aiQuestionsCount}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trivia Cards Surfaced</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFE259', marginTop: '4px' }}>{analytics.triviaCardsSurfacedCount}</div>
              </div>
            </div>

            <button
              onClick={() => setShowAnalytics(false)}
              className="btn-netflix"
              style={{ width: '100%' }}
            >
              Close Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
