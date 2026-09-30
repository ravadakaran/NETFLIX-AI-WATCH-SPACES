import React, { useState, useEffect } from 'react';
import { User, Title, WatchSpace, RecommendationItem, HistoryItem } from './types';
import { api, setToken, removeToken } from './services/api';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomeCinema } from './components/HomeCinema';
import { Discover } from './components/Discover';
import { MySpacesHub } from './components/MySpacesHub';
import { WatchRoom } from './components/WatchRoom';
import { LandingPage } from './components/LandingPage';
import { SignInView } from './components/SignInView';
import { SignUpView } from './components/SignUpView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { AdminTimelineView } from './components/AdminTimelineView';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

const WatchRoomWrapper: React.FC<{
  activeSpace: WatchSpace | null;
  setActiveSpace: (s: WatchSpace) => void;
  currentUser: User;
  onLeave: () => void;
}> = ({ activeSpace, setActiveSpace, currentUser, onLeave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!activeSpace);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSpace && id) {
      api.joinSpaceById(id)
        .then(s => {
          setActiveSpace(s);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id, activeSpace, setActiveSpace]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050712] text-white">
        <h2 className="text-xl mb-4">Error loading Watch Space</h2>
        <p className="text-red-400 mb-6">{error}</p>
        <button onClick={() => navigate('/spaces')} className="px-6 py-2 bg-pink-500 rounded-full">Go to My Spaces</button>
      </div>
    );
  }

  if (loading || !activeSpace) {
    return <div className="flex items-center justify-center h-screen text-white bg-[#050712]">Loading Watch Space...</div>;
  }

  return <WatchRoom space={activeSpace} currentUser={currentUser} onLeave={onLeave} />;
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [titles, setTitles] = useState<Title[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<WatchSpace[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state managed by React Router now
  const [activeSpace, setActiveSpace] = useState<WatchSpace | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [modalInitialTitle, setModalInitialTitle] = useState<Title | undefined>(undefined);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [mySpaces, setMySpaces] = useState<WatchSpace[]>([]);

  // Notifications & Loading
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Authentication & Data Ingestion
  useEffect(() => {
    initApp();

    const handleAuthExpired = () => {
      setCurrentUser(null);
      navigate('/login');
      showToast('Your session expired. Please sign in again.');
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);

      // Check if user has an existing authenticated token
      const token = localStorage.getItem('netflix_token');
      if (token) {
        try {
          const authUser = await api.getCurrentUser();
          setCurrentUser(authUser);
        } catch (err: any) {
          console.warn('Existing session token invalid or expired, resetting:', err.message);
          removeToken();
          setCurrentUser(null);
          navigate('/');
        }
      } else {
        setCurrentUser(null);
      }

      // Load all backend entities
      const [titlesRes, spacesRes] = await Promise.all([
        api.getTitles().catch(() => []),
        api.getActiveSpaces().catch(() => [])
      ]);

      if (titlesRes && titlesRes.length > 0) {
        setTitles(titlesRes);
      }
      if (spacesRes && spacesRes.length > 0) {
        setActiveSpaces(spacesRes);
      }

      if (token) {
        const [recsRes, histRes, mySpacesRes] = await Promise.all([
          api.getRecommendations().catch(() => ({ items: [] })),
          api.getHistory().catch(() => []),
          api.getMySpaces().catch(() => [])
        ]);
        setRecommendations(recsRes.items || []);
        setHistory(histRes || []);
        if (mySpacesRes) setMySpaces(mySpacesRes);
      }
    } catch (err: any) {
      console.warn('Backend connection note, activating rich offline state:', err.message);
      fallbackDemoState();
    } finally {
      setLoading(false);
    }
  };

  const fallbackDemoState = () => {
    const demoTitles: Title[] = [
      {
        id: 't_cyberpunk',
        name: 'Cyberpunk 2099: Neo Nexus',
        description: 'An AI investigator and undercover detective uncover a conspiracy that threatens synthetic intelligence across dystopian megacities.',
        genre: 'Sci-Fi',
        durationSeconds: 600,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 't_cosmos',
        name: 'Cosmos Deep: Journey to Andromeda',
        description: 'An astonishing visual odyssey across dark matter voids and newly discovered exoplanetary systems, mastered in Dolby Vision.',
        genre: 'Documentary',
        durationSeconds: 900,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 't_solitude',
        name: 'Symphony of Solitude: Part II',
        description: 'A psychological examination of isolation within deep orbital installations, featuring an evocative analog synthesizer soundtrack.',
        genre: 'Drama',
        durationSeconds: 720,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 't_tokyo',
        name: 'Tokyo Twilight: Midnight Rain',
        description: 'Atmospheric neo-noir journey through neon-lit streets, following two strangers connected through a synchronized neural acoustic channel.',
        genre: 'Auteur Noir',
        durationSeconds: 840,
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80'
      }
    ];

    setTitles(demoTitles);

    const demoSpaces: WatchSpace[] = [
      {
        watchSpaceId: 'ws_demo_01',
        titleId: 't_cyberpunk',
        titleName: 'Cyberpunk 2099: Neo Nexus',
        videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        durationSeconds: 600,
        inviteCode: 'NX-DEMO',
        status: 'LIVE',
        hostUserId: 'u_curator_demo',
        hostDisplayName: 'Cinema Curator',
        maxParticipants: 25,
        activeParticipantsCount: 4,
        aiVerbosity: 'normal',
        votingEnabled: true,
        playbackState: 'play',
        positionSeconds: 145,
        createdAt: new Date().toISOString(),
        participants: [
          { userId: 'u_curator_demo', displayName: 'Cinema Curator', email: 'curator@example.com', joinedAt: new Date().toISOString(), isHost: true }
        ]
      }
    ];
    setActiveSpaces(demoSpaces);

    setRecommendations([
      {
        titleId: 't_cosmos',
        title: 'Cosmos Deep: Journey to Andromeda',
        genre: 'Documentary',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        description: 'Astonishing visual odyssey through uncharted star clusters.',
        score: 0.96,
        reason: 'Matches your interest in speculative astrophysics and high-bitrate spatial audio.'
      },
      {
        titleId: 't_solitude',
        title: 'Symphony of Solitude: Part II',
        genre: 'Drama',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
        description: 'Evocative study of human condition in remote outposts.',
        score: 0.91,
        reason: 'Selected based on co-watching trends in your circle.'
      }
    ]);

    setHistory([
      {
        id: 'h_1',
        titleId: 't_cyberpunk',
        titleName: 'Cyberpunk 2099: Neo Nexus',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        watchedSeconds: 410,
        durationSeconds: 600,
        completed: false,
        rating: 5,
        watchedAt: new Date().toISOString()
      }
    ]);
  };

  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    navigate('/');
    showToast('Signed out of Watch Spaces session.');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.displayName}!`);
    // Refresh recommendations and history
    api.getRecommendations().then(r => setRecommendations(r.items || [])).catch(() => {});
    api.getHistory().then(setHistory).catch(() => {});
  };

  const handleJoinSpace = async (spaceId: string) => {
    try {
      const space = await api.joinSpaceById(spaceId);
      setActiveSpace(space);
      navigate(`/spaces/${space.watchSpaceId}`);
      showToast(`Entered Watch Space: ${space.titleName}`);
    } catch (err: any) {
      // If offline or demo, search activeSpaces
      const match = activeSpaces.find(s => s.watchSpaceId === spaceId);
      if (match) {
        setActiveSpace(match);
        navigate(`/spaces/${match.watchSpaceId}`);
        showToast(`Entered Watch Space: ${match.titleName}`);
      } else {
        showToast(`Failed to join: ${err.message}`);
      }
    }
  };

  const handleQuickJoin = async (code: string) => {
    try {
      const space = await api.joinSpaceByCode(code);
      setIsJoinModalOpen(false);
      setActiveSpace(space);
      navigate(`/spaces/${space.watchSpaceId}`);
      showToast(`Joined space: ${space.titleName} (${code})!`);
    } catch (err: any) {
      // Check fallback demo code
      if (code.toUpperCase() === 'NX-DEMO' && activeSpaces.length > 0) {
        setIsJoinModalOpen(false);
        setActiveSpace(activeSpaces[0]);
        navigate(`/spaces/${activeSpaces[0].watchSpaceId}`);
        showToast(`Joined Demo Watch Space: ${activeSpaces[0].titleName}`);
      } else {
        showToast(`Invalid token or room closed: ${err.message}`);
      }
    }
  };

  const handleJoinDemo = async () => {
    await handleQuickJoin('NX-DEMO');
  };

  const handleOpenCreateModal = (title?: Title) => {
    setModalInitialTitle(title);
    setIsCreateModalOpen(true);
  };

  const handleCreateSpace = async (
    titleId: string,
    maxParticipants: number,
    aiVerbosity: string,
    votingEnabled: boolean
  ) => {
    try {
      const space = await api.createWatchSpace(titleId, maxParticipants, aiVerbosity, votingEnabled);
      setIsCreateModalOpen(false);
      setActiveSpace(space);
      navigate(`/spaces/${space.watchSpaceId}`);
      showToast(`Watch Space live! Invite Code: ${space.inviteCode}`);
      // Refresh list
      api.getActiveSpaces().then(setActiveSpaces).catch(() => {});
    } catch (err: any) {
      // Fallback local creation
      const t = titles.find(x => x.id === titleId) || titles[0];
      const newSpace: WatchSpace = {
        watchSpaceId: 'ws_' + Date.now(),
        titleId: t.id,
        titleName: t.name,
        videoAssetUrl: t.videoAssetUrl,
        durationSeconds: t.durationSeconds,
        inviteCode: 'WS-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        status: 'LIVE',
        hostUserId: currentUser?.id || 'u_host',
        hostDisplayName: currentUser?.displayName || 'Host',
        maxParticipants,
        activeParticipantsCount: 1,
        aiVerbosity,
        votingEnabled,
        playbackState: 'pause',
        positionSeconds: 0,
        createdAt: new Date().toISOString(),
        participants: [
          {
            userId: currentUser?.id || `user_${Date.now()}`,
            displayName: currentUser?.displayName || 'Host',
            email: currentUser?.email || '',
            joinedAt: new Date().toISOString(),
            isHost: true
          }
        ]
      };
      setIsCreateModalOpen(false);
      setActiveSpaces(prev => [newSpace, ...prev]);
      setActiveSpace(newSpace);
      navigate(`/spaces/${newSpace.watchSpaceId}`);
      showToast(`Watch Space launched! Invite Code: ${newSpace.inviteCode}`);
    }
  };

  const handleSelectTitleSolo = async (title: Title) => {
    handleCreateSpace(title.id, 1, 'normal', true);
  };

  const handleUpdateProfile = async (data: { displayName?: string; subtitleLocale?: string; password?: string }) => {
    try {
      const updatedUser = await api.updateProfile(data);
      setCurrentUser(updatedUser);
      setIsProfileSettingsOpen(false);
      showToast('Profile updated successfully.');
    } catch (err: any) {
      showToast(`Failed to update profile: ${err.message}`);
    }
  };

  const isPublicPage = location.pathname === '/' && !currentUser || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Top Navbar: only visible on authenticated cinema portal pages */}
      {!isPublicPage && (
        <Navbar
          currentUser={currentUser}
          activeTab={location.pathname.substring(1) || 'home'}
          setActiveTab={(tab) => {
            navigate(tab === 'home' ? '/' : `/${tab}`);
          }}
          onOpenCreateModal={() => handleOpenCreateModal()}
          onOpenLogin={() => navigate('/login')}
          onLogout={handleLogout}
          onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
          hasActiveSpace={!!activeSpace}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#080D24]/95 backdrop-blur-2xl border border-violet-500/30 text-white text-xs font-bold tracking-wide shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(139,92,246,0.35)] flex items-center gap-2.5 animate-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[18px] text-pink-400" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className={`flex-1 w-full ${isPublicPage ? '' : 'pt-20'}`}>
        <Routes>
          <Route path="/" element={
            !currentUser ? (
              <LandingPage
                titles={titles}
                activeSpaces={activeSpaces}
                onGetStarted={() => navigate('/signup')}
                onSignIn={() => navigate('/login')}
              />
            ) : (
              <HomeCinema
                currentUser={currentUser}
                titles={titles}
                activeSpaces={activeSpaces}
                recommendations={recommendations}
                history={history}
                onOpenCreateModal={handleOpenCreateModal}
                onJoinSpace={handleJoinSpace}
                onQuickJoinDemo={handleJoinDemo}
                onNavigateTab={(path) => navigate(path === 'home' ? '/' : `/${path}`)}
                onSelectTitle={handleSelectTitleSolo}
              />
            )
          } />

          <Route path="/login" element={
            <SignInView
              onSuccess={(user) => {
                handleLoginSuccess(user);
                navigate('/');
              }}
              onGoToSignUp={() => navigate('/signup')}
              onGoToLanding={() => navigate('/')}
            />
          } />

          <Route path="/signup" element={
            <SignUpView
              onSuccess={(user) => {
                handleLoginSuccess(user);
                navigate('/');
              }}
              onGoToSignIn={() => navigate('/login')}
              onGoToLanding={() => navigate('/')}
            />
          } />

          <Route path="/spaces/:id" element={
            currentUser ? (
              <WatchRoomWrapper
                activeSpace={activeSpace}
                setActiveSpace={setActiveSpace}
                currentUser={currentUser}
                onLeave={() => {
                  navigate('/spaces');
                  api.getMySpaces().then(setMySpaces).catch(() => {});
                  api.getActiveSpaces().then(setActiveSpaces).catch(() => {});
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          <Route path="/discover" element={
            <Discover
              currentUser={currentUser}
              titles={titles}
              onOpenCreateModal={handleOpenCreateModal}
              onSelectTitle={handleSelectTitleSolo}
            />
          } />

          <Route path="/spaces" element={
            <MySpacesHub
              currentUser={currentUser}
              activeSpaces={mySpaces.length > 0 ? mySpaces : activeSpaces}
              history={history}
              titles={titles}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenJoinModal={() => setIsJoinModalOpen(true)}
              onJoinSpace={handleJoinSpace}
              onQuickJoinDemo={handleJoinDemo}
            />
          } />

          <Route path="/admin" element={
            currentUser?.role === 'ADMIN' ? (
              <AdminTimelineView titles={titles} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
        </Routes>
      </main>

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <CreateRoomModal
          titles={titles}
          initialTitle={modalInitialTitle}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateSpace}
        />
      )}

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <JoinRoomModal
          onClose={() => setIsJoinModalOpen(false)}
          onJoin={handleQuickJoin}
        />
      )}

      {/* Profile Settings Modal */}
      {isProfileSettingsOpen && currentUser && (
        <ProfileSettingsModal
          currentUser={currentUser}
          onClose={() => setIsProfileSettingsOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};
