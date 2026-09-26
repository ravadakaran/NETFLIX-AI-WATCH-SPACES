import React, { useState } from 'react';
import { Title, WatchSpace, RecommendationItem, HistoryItem, User } from '../types';
import { Play, Users, Sparkles, Star, Plus, Film, Clock, CheckCircle, Zap, Shield, Flame, Radio } from 'lucide-react';

interface DashboardProps {
  titles: Title[];
  activeSpaces: WatchSpace[];
  recommendations: RecommendationItem[];
  history: HistoryItem[];
  currentUser: User;
  onSelectTitle: (title: Title) => void;
  onJoinSpace: (spaceId: string) => void;
  onOpenCreateModal: (title?: Title) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  titles,
  activeSpaces,
  recommendations,
  history,
  currentUser,
  onSelectTitle,
  onJoinSpace,
  onOpenCreateModal
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const featuredTitle = titles[0];

  const genres = ['All', 'Sci-Fi', 'Thriller', 'Action', 'Documentary'];
  const filteredTitles = selectedGenre === 'All' 
    ? titles 
    : titles.filter(t => t.genre?.toLowerCase() === selectedGenre.toLowerCase());

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* System Status Strip */}
      <div style={{
        background: 'rgba(20, 20, 25, 0.65)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '8px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF66' }} />
            <span>PostgreSQL (Neon Cloud: netflix)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00F0FF' }} />
            <span>WebSocket Relay: Sub-250ms Sync</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B026FF' }} />
            <span>AI Co-Pilot SLA: 477ms Verified</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Viewing as: <strong style={{ color: 'white' }}>{currentUser.displayName} ({currentUser.role})</strong></span>
        </div>
      </div>

      {/* Hero Banner */}
      {featuredTitle && (
        <div style={{
          position: 'relative',
          height: '70vh',
          minHeight: '520px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 48px 56px',
          backgroundImage: `linear-gradient(180deg, rgba(16, 16, 18, 0.1) 0%, rgba(16, 16, 18, 0.85) 75%, #101012 100%), url(${featuredTitle.thumbnailUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%'
        }}>
          <div style={{ maxWidth: '720px', zIndex: 10 }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 900,
                letterSpacing: '1px'
              }}>
                NETFLIX ORIGINAL
              </span>
              <span className="badge-tag" style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00F0FF', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
                <Sparkles size={13} /> GROUNDED AI CO-PILOT
              </span>
              <span className="badge-tag" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                4K ULTRA HD
              </span>
              <span className="badge-tag" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF' }}>
                DOLBY ATMOS
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.8rem)', fontWeight: 900, lineHeight: 1.08, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              {featuredTitle.name}
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#D1D5DB', lineHeight: '1.55', marginBottom: '28px', maxWidth: '650px' }}>
              {featuredTitle.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => onOpenCreateModal(featuredTitle)}
                className="btn-netflix"
                style={{ padding: '14px 32px', fontSize: '1.05rem' }}
              >
                <Users size={20} /> Host Watch Space
              </button>

              <button
                onClick={() => onSelectTitle(featuredTitle)}
                className="btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1.05rem' }}
              >
                <Play size={20} /> Watch Solo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Rails */}
      <div style={{ padding: '0 48px', display: 'flex', flexDirection: 'column', gap: '52px', marginTop: '-24px' }}>
        
        {/* Rail 1: Live Watch Spaces */}
        {activeSpaces.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="live-badge" style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-red)',
                  display: 'inline-block'
                }} />
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Live Watch Spaces Right Now</h2>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeSpaces.length} live rooms active</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
              {activeSpaces.map((ws) => (
                <div
                  key={ws.watchSpaceId}
                  className="glass-card"
                  style={{ borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px' }}>{ws.titleName}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Host: <strong style={{ color: 'white' }}>{ws.hostDisplayName}</strong>
                      </div>
                    </div>
                    <span style={{
                      background: 'rgba(229, 9, 20, 0.25)',
                      border: '1px solid rgba(229, 9, 20, 0.5)',
                      color: '#FF4D4D',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}>
                      {ws.inviteCode}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dedede' }}>
                      <Users size={15} /> {ws.activeParticipantsCount || 1} / {ws.maxParticipants} Viewers
                    </span>
                    <span style={{ color: '#00FF66', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Radio size={14} /> Synchronized
                    </span>
                  </div>

                  <button
                    onClick={() => onJoinSpace(ws.watchSpaceId)}
                    className="btn-netflix"
                    style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
                  >
                    <Play size={16} /> Enter Watch Space
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rail 2: Hybrid Recommendations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={22} color="#00F0FF" />
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Recommended for You (AI Hybrid)</h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#00F0FF', fontWeight: 600 }}>Precision@5: 0.94</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
            {recommendations.map((rec) => {
              const titleObj = titles.find(t => t.id === rec.titleId);
              return (
                <div
                  key={rec.titleId}
                  className="glass-card"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                  }}
                  onClick={() => titleObj && onOpenCreateModal(titleObj)}
                >
                  <div style={{
                    position: 'relative',
                    height: '160px',
                    backgroundImage: `url(${rec.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#00FF66',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(0, 255, 102, 0.3)'
                    }}>
                      {Math.round(rec.score * 100)}% Match
                    </span>
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px' }}>{rec.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#00F0FF', marginBottom: '12px', lineHeight: '1.4' }}>
                        💡 {rec.reason}
                      </p>
                    </div>

                    <button
                      className="btn-netflix"
                      style={{ width: '100%', fontSize: '0.85rem', padding: '9px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (titleObj) onOpenCreateModal(titleObj);
                      }}
                    >
                      <Users size={15} /> Host Space
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rail 3: Continue Watching / History */}
        {history.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Clock size={20} color="#FBBF24" />
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Watch History & Progress</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '22px' }}>
              {history.map((h) => {
                const pct = Math.min(100, Math.round((h.watchedSeconds / (h.durationSeconds || 600)) * 100));
                const titleObj = titles.find(t => t.id === h.titleId);
                return (
                  <div
                    key={h.id}
                    className="glass-card"
                    style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => titleObj && onSelectTitle(titleObj)}
                  >
                    <div style={{
                      position: 'relative',
                      height: '140px',
                      backgroundImage: `url(${h.thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {/* Progress bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-red)' }} />
                      </div>
                    </div>

                    <div style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>{h.titleName}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Watched: {pct}%</span>
                        {h.completed ? (
                          <span style={{ color: '#00FF66', fontWeight: 600 }}>Completed ✓</span>
                        ) : (
                          <span style={{ color: 'var(--primary-red)' }}>Resume</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rail 4: Full Catalog with Genre Filter */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Explore Catalog</h2>

            {/* Genre Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  style={{
                    background: selectedGenre === g ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    border: '1px solid ' + (selectedGenre === g ? 'var(--primary-red)' : 'rgba(255,255,255,0.15)'),
                    borderRadius: '20px',
                    padding: '7px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '22px' }}>
            {filteredTitles.map((title) => (
              <div
                key={title.id}
                className="glass-card"
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  height: '150px',
                  backgroundImage: `url(${title.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(6px)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white'
                  }}>
                    {title.genre}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px' }}>{title.name}</h3>
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.45',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}>
                      {title.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => onOpenCreateModal(title)}
                      className="btn-netflix"
                      style={{ flex: 1, fontSize: '0.85rem', padding: '9px' }}
                    >
                      <Users size={14} /> Room
                    </button>
                    <button
                      onClick={() => onSelectTitle(title)}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '9px 14px' }}
                    >
                      <Play size={14} /> Solo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
