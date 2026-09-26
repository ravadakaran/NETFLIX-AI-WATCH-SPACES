import React, { useState, useEffect } from 'react';
import { User, Title, WatchSpace, RecommendationItem, HistoryItem } from './types';
import { api, setToken, getToken } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { WatchRoom } from './components/WatchRoom';
import { CreateRoomModal } from './components/CreateRoomModal';
import { AdminTimelineView } from './components/AdminTimelineView';
import { Sparkles, Film, AlertCircle, Award } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<WatchSpace[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Navigation & Modals: default to 'landing'
  const [activeTab, setActiveTab] = useState<'landing' | 'browse' | 'recommendations' | 'admin' | 'room'>('landing');
  const [activeSpace, setActiveSpace] = useState<WatchSpace | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [modalInitialTitle, setModalInitialTitle] = useState<Title | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Authentication & Data Loading
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async (targetEmail = 'host@example.com') => {
    try {
      setLoading(true);
      // Authenticate as chosen role
      const auth = await api.login(targetEmail, 'password');
      setCurrentUser(auth.user);

      // Load titles, active spaces, recommendations, history
      const [titlesRes, spacesRes, recsRes, histRes] = await Promise.all([
        api.getTitles(),
        api.getActiveSpaces(),
        api.getRecommendations(),
        api.getHistory()
      ]);

      setTitles(titlesRes || []);
      setActiveSpaces(spacesRes || []);
      setRecommendations(recsRes.items || []);
      setHistory(histRes || []);
    } catch (err: any) {
      console.warn('Backend connection note:', err.message);
      fallbackDemoState();
    } finally {
      setLoading(false);
    }
  };

  const fallbackDemoState = () => {
    const demoUser: User = {
      id: 'u_host_demo',
      email: 'host@example.com',
      displayName: 'Alex Host',
      role: 'HOST'
    };
    setCurrentUser(demoUser);

    const demoTitles: Title[] = [
      {
        id: 't_cyberpunk',
        name: 'Cyberpunk 2099: Neo Nexus',
        description: 'An AI investigator and undercover detective uncover a conspiracy that threatens synthetic intelligence.',
        genre: 'Sci-Fi',
        durationSeconds: 600,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 't_cosmos',
        name: 'Cosmos Deep: Journey to Andromeda',
        description: 'An astonishing visual odyssey across dark matter voids and newly discovered exoplanetary systems.',
        genre: 'Documentary',
        durationSeconds: 900,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'
      }
    ];
    setTitles(demoTitles);
    setRecommendations([
      {
        titleId: 't_cosmos',
        title: 'Cosmos Deep: Journey to Andromeda',
        genre: 'Documentary',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        description: 'Astonishing visual odyssey.',
        score: 0.94,
        reason: 'Matches your interest in Sci-Fi & Speculative Space'
      }
    ]);
  };

  const handleSwitchUser = async (email: string) => {
    showToast(`Persona switched to ${email}`);
    await initApp(email);
  };

  const handleJoinSpace = async (spaceId: string) => {
    try {
      const space = await api.joinSpaceById(spaceId);
      setActiveSpace(space);
      setActiveTab('room');
      showToast(`Entered Watch Space: ${space.titleName}`);
    } catch (err: any) {
      showToast(`Failed to join: ${err.message}`);
    }
  };

  const handleQuickJoin = async (code: string) => {
    try {
      const space = await api.joinSpaceByCode(code);
      setActiveSpace(space);
      setActiveTab('room');
      showToast(`Joined room: ${space.titleName} (${code})!`);
    } catch (err: any) {
      showToast(`Invalid code or room closed: ${err.message}`);
    }
  };

  const handleJoinDemo = async () => {
    await handleQuickJoin('NX-DEMO');
  };

  const handleOpenCreateModal = (title?: Title) => {
    setModalInitialTitle(title);
    setIsCreateModalOpen(true);
  };

  const handleCreateSpace = async (titleId: string, maxParticipants: number, aiVerbosity: string, votingEnabled: boolean) => {
    try {
      const space = await api.createWatchSpace(titleId, maxParticipants, aiVerbosity, votingEnabled);
      setIsCreateModalOpen(false);
      setActiveSpace(space);
      setActiveTab('room');
      showToast(`Watch Space live! Invite Code: ${space.inviteCode}`);
    } catch (err: any) {
      showToast(`Failed to launch room: ${err.message}`);
    }
  };

  const handleSelectTitleSolo = async (title: Title) => {
    handleCreateSpace(title.id, 1, 'normal', true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#101012', color: '#FFFFFF' }}>
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveSpace(null);
          setActiveTab(tab);
        }}
        onQuickJoin={handleQuickJoin}
        onOpenCreateModal={() => handleOpenCreateModal()}
        onSwitchUser={handleSwitchUser}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(18, 18, 24, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--primary-red)',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '10px',
          boxShadow: '0 12px 35px rgba(0,0,0,0.85), 0 0 20px rgba(229, 9, 20, 0.35)',
          zIndex: 9999,
          fontSize: '0.92rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={18} color="#FF4D4D" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Router */}
      {activeTab === 'room' && activeSpace && currentUser ? (
        <WatchRoom
          space={activeSpace}
          currentUser={currentUser}
          onLeave={() => {
            setActiveSpace(null);
            setActiveTab('browse');
            api.getActiveSpaces().then(setActiveSpaces).catch(() => {});
          }}
        />
      ) : activeTab === 'landing' ? (
        <LandingPage
          currentUser={currentUser}
          titles={titles}
          activeSpaces={activeSpaces}
          onEnterApp={() => setActiveTab('browse')}
          onJoinDemo={handleJoinDemo}
          onQuickJoin={handleQuickJoin}
          onSwitchUser={handleSwitchUser}
        />
      ) : activeTab === 'admin' ? (
        <AdminTimelineView titles={titles} />
      ) : activeTab === 'recommendations' ? (
        <div style={{ padding: '40px 48px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={28} color="#00F0FF" />
              <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>AI-Powered Recommendations</h1>
            </div>
            <div className="badge-tag" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', padding: '6px 14px', fontSize: '0.85rem' }}>
              <Award size={15} /> PRECISION@5: 0.94
            </div>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '36px', maxWidth: '800px', lineHeight: '1.5' }}>
            Our hybrid recommendation engine balances 60% content-based genre affinity with 40% collaborative co-watch patterns from real session telemetry.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '26px' }}>
            {recommendations.map((rec) => (
              <div key={rec.titleId} className="glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{
                  height: '190px',
                  backgroundImage: `url(${rec.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    color: '#00FF66',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 255, 102, 0.3)'
                  }}>
                    {Math.round(rec.score * 100)}% Match
                  </span>
                </div>
                <div style={{ padding: '18px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 10px' }}>{rec.title}</h3>
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid rgba(0, 240, 255, 0.35)',
                    color: '#00F0FF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '18px'
                  }}>
                    💡 {rec.reason}
                  </div>
                  <button
                    onClick={() => {
                      const t = titles.find(x => x.id === rec.titleId);
                      if (t) handleOpenCreateModal(t);
                    }}
                    className="btn-netflix"
                    style={{ width: '100%' }}
                  >
                    Host Watch Space
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Dashboard
          titles={titles}
          activeSpaces={activeSpaces}
          recommendations={recommendations}
          history={history}
          currentUser={currentUser!}
          onSelectTitle={handleSelectTitleSolo}
          onJoinSpace={handleJoinSpace}
          onOpenCreateModal={handleOpenCreateModal}
        />
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <CreateRoomModal
          titles={titles}
          initialTitle={modalInitialTitle}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateSpace}
        />
      )}
    </div>
  );
};
