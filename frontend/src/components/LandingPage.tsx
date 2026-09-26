import React, { useState } from 'react';
import { User, WatchSpace, Title } from '../types';
import { 
  Play, Users, Sparkles, Shield, Zap, Vote, 
  MessageSquare, Film, ArrowRight, CheckCircle2, 
  Activity, Clock, Layers, Award, Terminal
} from 'lucide-react';

interface LandingPageProps {
  currentUser: User | null;
  titles: Title[];
  activeSpaces: WatchSpace[];
  onEnterApp: () => void;
  onJoinDemo: () => void;
  onQuickJoin: (code: string) => void;
  onSwitchUser: (email: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  titles,
  activeSpaces,
  onEnterApp,
  onJoinDemo,
  onQuickJoin,
  onSwitchUser
}) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'sync' | 'ai' | 'vote' | 'recs'>('sync');
  const [quickCode, setQuickCode] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onQuickJoin(quickCode.trim());
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '100px 32px 80px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(229, 9, 20, 0.28) 0%, rgba(0, 240, 255, 0.08) 50%, transparent 75%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Eyebrow Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(229, 9, 20, 0.12)',
          border: '1px solid rgba(229, 9, 20, 0.35)',
          marginBottom: '24px',
          zIndex: 1
        }}>
          <span className="live-badge" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-red)'
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', color: '#FF4D4D' }}>
            THE FUTURE OF CO-STREAMING • AI-POWERED WATCH PARTIES
          </span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.8rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          maxWidth: '1000px',
          marginBottom: '24px',
          zIndex: 1
        }}>
          Stream Together. Think Together.{' '}
          <span className="text-gradient-red">Decide Together.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 1.3vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '740px',
          lineHeight: '1.6',
          marginBottom: '40px',
          zIndex: 1
        }}>
          Ultra-synchronized 4K video playback with host authority and sub-250ms latency.
          Featuring a scene-grounded AI Co-Pilot, real-time room chat, and interactive narrative variation voting.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', zIndex: 1, marginBottom: '48px' }}>
          <button
            onClick={onEnterApp}
            className="btn-netflix"
            style={{ fontSize: '1.05rem', padding: '14px 32px' }}
          >
            <Play size={20} /> Enter Watch Spaces
          </button>

          <button
            onClick={onJoinDemo}
            className="btn-cyber"
            style={{ fontSize: '1.05rem', padding: '14px 28px' }}
          >
            <Zap size={20} /> Instant Demo (NX-DEMO)
          </button>

          {/* Quick Join Inline */}
          <form onSubmit={handleQuickSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Invite code..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                padding: '13px 16px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                width: '150px'
              }}
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{
                borderRadius: '0 8px 8px 0',
                padding: '13px 18px',
                fontSize: '0.95rem'
              }}
            >
              Join
            </button>
          </form>
        </div>

        {/* Hero Interactive Cinematic Preview Frame */}
        <div 
          className="glass-card animate-float"
          style={{
            maxWidth: '1020px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(229, 9, 20, 0.4)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(229, 9, 20, 0.25)',
            marginBottom: '48px',
            position: 'relative'
          }}
        >
          <img
            src="/hero-preview.jpg"
            alt="Netflix AI Watch Spaces Cinematic Interface"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            background: 'linear-gradient(transparent, rgba(10, 10, 14, 0.95))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cybernetic Rising: Synchronized AI Space</div>
              <div style={{ fontSize: '0.82rem', color: '#00F0FF' }}>⚡ Live Clock Sync Drift: 12ms • Room Code: NX-DEMO</div>
            </div>
            <button
              onClick={onJoinDemo}
              className="btn-netflix"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Zap size={16} /> Enter Live Space
            </button>
          </div>
        </div>

        {/* Metrics Ribbon */}
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '920px',
          borderRadius: '16px',
          padding: '24px 32px',
          zIndex: 1,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00FF66' }}>12ms</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sync Drift Latency</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00F0FF' }}>477ms</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI Co-Pilot SLA</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FF4D4D' }}>100%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Grounded Timeline Citations</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFE259' }}>50+</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Viewers Per Space</div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demonstration (Connecting the Dots) */}
      <section style={{
        padding: '60px 48px 80px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00F0FF', letterSpacing: '1px' }}>
            CONNECTING ALL DOTS
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '8px 0 12px' }}>
            Everything You Need for Next-Gen Group Watching
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Experience how real-time WebSockets, Neon PostgreSQL, and timeline AI harmonize into one fluid co-viewing ecosystem.
          </p>
        </div>

        {/* Feature Tabs Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'sync', label: '⚡ Authoritative Sync', icon: Zap },
            { id: 'ai', label: '🧠 Grounded AI Co-Pilot', icon: Sparkles },
            { id: 'vote', label: '🔮 Interactive Branch Voting', icon: Vote },
            { id: 'recs', label: '🎯 Hybrid Recommendations', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeFeatureTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id as any)}
                style={{
                  background: active ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: active ? '1px solid var(--primary-red)' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: active ? '#FFFFFF' : 'var(--text-muted)',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} color={active ? '#E50914' : '#9E9EA8'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Card */}
        <div className="glass-panel" style={{
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        }}>
          {activeFeatureTab === 'sync' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div className="badge-tag" style={{ background: 'rgba(0, 255, 102, 0.15)', color: '#00FF66', marginBottom: '12px' }}>
                  <Zap size={14} /> Sub-250ms Guarantee
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>
                  Host-Authoritative Synchronized Playback
                </h3>
                <p style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '20px' }}>
                  No more countdowns or mismatched pauses. When the Host presses play, pauses, or seeks, state updates broadcast instantly across namespaced WebSockets. Clients calculate clock drift through heartbeat ping/pongs and auto-align within 250 milliseconds.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00FF66" />
                    <span>Host-controlled Play, Pause, and Seek synchronization</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00FF66" />
                    <span>Real-time roundtrip drift measurement every 4 seconds</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00FF66" />
                    <span>Deterministic reconnect state recovery without duplicate joins</span>
                  </li>
                </ul>
                <button onClick={onJoinDemo} className="btn-netflix">
                  Test Sync in Demo Room
                </button>
              </div>

              {/* Visual Graphic */}
              <div style={{
                background: '#0d0d10',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>ROOM STATE MACHINE</span>
                  <div className="sync-badge">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF66' }} />
                    <span>Drift: 12ms</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(229, 9, 20, 0.15)', border: '1px solid rgba(229, 9, 20, 0.4)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#FF4D4D', fontWeight: 700 }}>
                      <span>HOST (Alex Host)</span>
                      <span>PLAY @ 00:35.4s</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Dispatched event: room.playback.update</div>
                  </div>

                  <div style={{ textAlign: 'center', color: '#00F0FF', fontSize: '0.8rem', fontWeight: 700 }}>
                    ↓ Broadcasted to 4 Connected Viewers (RTT: 24ms)
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#00FF66', fontWeight: 700 }}>
                      <span>VIEWER (Sam Viewer)</span>
                      <span>SYNCED @ 00:35.4s</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Local playback adjusted (drift: 8ms)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'ai' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div className="badge-tag" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', marginBottom: '12px' }}>
                  <Sparkles size={14} /> Grounded Timeline Engine
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>
                  Context-Aware In-Stream AI Co-Pilot
                </h3>
                <p style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '20px' }}>
                  Our AI Copilot is strictly grounded in authored scene timelines. When you ask about a character, location, or plot point, it analyzes preceding timestamp markers and cites verified event IDs without fabricating facts.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00F0FF" />
                    <span>Real-time timestamp awareness (queries scoped up to current second)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00F0FF" />
                    <span>Autonomic trivia alerts surfaced as video crosses authored markers</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#00F0FF" />
                    <span>Guaranteed factual citations citing specific event IDs (e.g. evt_a8f1)</span>
                  </li>
                </ul>
                <button onClick={onEnterApp} className="btn-netflix">
                  Explore Grounded Titles
                </button>
              </div>

              {/* Sample AI Dialog */}
              <div style={{
                background: '#0d0d10',
                borderRadius: '12px',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Viewer Query @ 00:40</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>"Who is Detective Rios?"</div>
                </div>

                <div style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00F0FF', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    <Sparkles size={14} /> AI Co-Pilot Answer
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#E5E7EB', lineHeight: '1.4', margin: '0 0 10px' }}>
                    "Detective Rios (former homicide partner of the victim, now investigating rogue synthetic constructs), introduced at 00:15."
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#00F0FF', background: 'rgba(0,240,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Citation: evt_a8f1bff1
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#00FF66' }}>Latency: 477ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'vote' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div className="badge-tag" style={{ background: 'rgba(229, 9, 20, 0.15)', color: '#FF4D4D', marginBottom: '12px' }}>
                  <Vote size={14} /> Audience Democracy
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>
                  Synchronized Narrative Variation Voting
                </h3>
                <p style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '20px' }}>
                  Transform passive viewers into an interactive audience. When video hits pre-authored variation points, an on-screen poll appears simultaneously across every connected device. Winning options update the subtitle localization or story branch in lockstep.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FF4D4D" />
                    <span>Real-time vote registration and percentage tallying</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FF4D4D" />
                    <span>Simultaneous branch application to all clients</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FF4D4D" />
                    <span>Zero playback interruption during vote transitions</span>
                  </li>
                </ul>
                <button onClick={onJoinDemo} className="btn-netflix">
                  Try Interactive Voting
                </button>
              </div>

              {/* Sample Vote Card */}
              <div style={{
                background: '#0d0d10',
                borderRadius: '12px',
                border: '1px solid rgba(229, 9, 20, 0.4)',
                padding: '24px',
                boxShadow: '0 0 25px rgba(229,9,20,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF4D4D', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
                  <Vote size={16} /> LIVE NARRATIVE POLL @ 02:10
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                  Choose the decryption protocol strategy:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.15)',
                    border: '1px solid rgba(229, 9, 20, 0.5)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Aggressive Neural Overload</span>
                      <span style={{ color: '#FF4D4D' }}>67% (4 votes)</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '67%', background: 'var(--primary-red)' }} />
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>Stealth Quantum Bypass</span>
                      <span style={{ color: 'var(--text-muted)' }}>33% (2 votes)</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '33%', background: 'rgba(255,255,255,0.4)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'recs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div className="badge-tag" style={{ background: 'rgba(255, 184, 0, 0.15)', color: '#FFB800', marginBottom: '12px' }}>
                  <Award size={14} /> Hybrid Intelligence
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>
                  Adaptive Content & Collaborative Recommendations
                </h3>
                <p style={{ color: '#D1D5DB', lineHeight: '1.6', marginBottom: '20px' }}>
                  Recommendations update in real-time as you watch, rate, and participate in Watch Spaces. Our hybrid algorithm fuses 60% content-based genre affinity with 40% collaborative co-watch behavior, delivering a Precision@5 benchmark of over 0.92.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FFB800" />
                    <span>Real-time rank updates as new watch interactions occur</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FFB800" />
                    <span>Explainable match reasoning ("Matches your affinity in Sci-Fi")</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                    <CheckCircle2 size={18} color="#FFB800" />
                    <span>Comprehensive watch history with watched percentage tracking</span>
                  </li>
                </ul>
                <button onClick={onEnterApp} className="btn-netflix">
                  View Your AI Recommendations
                </button>
              </div>

              {/* Sample Recommendation Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="glass-card" style={{ borderRadius: '10px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    backgroundImage: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cyberpunk 2099: Neo Nexus</span>
                      <span style={{ color: '#00FF66', fontWeight: 800, fontSize: '0.8rem' }}>98% Match</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#00F0FF', marginBottom: '4px' }}>
                      💡 Matches your interest in Sci-Fi
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Co-watched by 89% of viewers who completed Echoes of the Void
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ borderRadius: '10px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    backgroundImage: 'url(https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cosmos Deep: Journey</span>
                      <span style={{ color: '#00FF66', fontWeight: 800, fontSize: '0.8rem' }}>92% Match</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#00F0FF', marginBottom: '4px' }}>
                      💡 Trending among viewers with similar tastes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      High completion rate in live group sessions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Role Selection Showcase */}
      <section style={{
        padding: '40px 48px 80px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Explore by Persona</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Switch personas anytime to experience host-authority, viewer sync, or admin timeline authoring.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Persona 1: Host */}
          <div className="glass-card" style={{ borderRadius: '14px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👑</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Alex Host</h3>
              <div className="badge-tag" style={{ background: 'rgba(229, 9, 20, 0.2)', color: '#FF4D4D', marginBottom: '16px' }}>
                HOST PRIVILEGES
              </div>
              <p style={{ fontSize: '0.9rem', color: '#D1D5DB', lineHeight: '1.5', marginBottom: '20px' }}>
                Full authoritative playback control (Play, Pause, Scrub). Can trigger audience polls, moderate participants, and end live sessions.
              </p>
            </div>
            <button
              onClick={() => {
                onSwitchUser('host@example.com');
                onEnterApp();
              }}
              className="btn-netflix"
              style={{ width: '100%' }}
            >
              Sign in as Host
            </button>
          </div>

          {/* Persona 2: Viewer */}
          <div className="glass-card" style={{ borderRadius: '14px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍿</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Sam Viewer</h3>
              <div className="badge-tag" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', marginBottom: '16px' }}>
                VIEWER EXPERIENCE
              </div>
              <p style={{ fontSize: '0.9rem', color: '#D1D5DB', lineHeight: '1.5', marginBottom: '20px' }}>
                Locks to host timeline with automatic drift correction. Participates in chat, reacts with emojis, asks the AI Copilot questions, and votes on story variations.
              </p>
            </div>
            <button
              onClick={() => {
                onSwitchUser('viewer@example.com');
                onEnterApp();
              }}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              Sign in as Viewer
            </button>
          </div>

          {/* Persona 3: Admin */}
          <div className="glass-card" style={{ borderRadius: '14px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>System Admin</h3>
              <div className="badge-tag" style={{ background: 'rgba(255, 184, 0, 0.2)', color: '#FFE259', marginBottom: '16px' }}>
                TIMELINE MANAGEMENT
              </div>
              <p style={{ fontSize: '0.9rem', color: '#D1D5DB', lineHeight: '1.5', marginBottom: '20px' }}>
                Validates and uploads authored JSON timeline schemas to Neon Cloud PostgreSQL, configuring scene markers, trivia, and story variations.
              </p>
            </div>
            <button
              onClick={() => {
                onSwitchUser('admin@example.com');
                onEnterApp();
              }}
              className="btn-cyber"
              style={{ width: '100%' }}
            >
              Sign in as Admin
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, color: 'var(--primary-red)' }}>NETFLIX</span>
          <span>AI WATCH SPACES © 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>PostgreSQL (Neon Cloud: netflix)</span>
          <span>Spring Boot 2.7.18</span>
          <span>Vite + React 18</span>
        </div>
      </footer>
    </div>
  );
};
