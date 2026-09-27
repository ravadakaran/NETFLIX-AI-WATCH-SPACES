import React from 'react';
import { Title, WatchSpace, RecommendationItem, HistoryItem, User } from '../types';

interface HomeCinemaProps {
  currentUser: User | null;
  titles: Title[];
  activeSpaces: WatchSpace[];
  recommendations: RecommendationItem[];
  history: HistoryItem[];
  onOpenCreateModal: (title?: Title) => void;
  onJoinSpace: (spaceId: string) => void;
  onQuickJoinDemo: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectTitle: (title: Title) => void;
}

export const HomeCinema: React.FC<HomeCinemaProps> = ({
  currentUser,
  titles,
  activeSpaces,
  recommendations,
  history,
  onOpenCreateModal,
  onJoinSpace,
  onQuickJoinDemo,
  onNavigateTab,
  onSelectTitle
}) => {
  // Hero featured title or first title
  const featuredTitle = titles[0] || {
    id: 't_cyberpunk',
    name: 'Cyberpunk 2099: Neo Nexus',
    description: 'An AI investigator and undercover detective uncover a conspiracy that threatens synthetic intelligence across dystopian megacities.',
    genre: 'Sci-Fi',
    durationSeconds: 600,
    videoAssetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'
  };

  return (
    <div className="w-full flex flex-col text-on-surface select-none pb-24">
      {/* ======================================================== */}
      {/* 1. FULL-SCREEN CINEMATIC HERO (Nocturne Luminary)         */}
      {/* ======================================================== */}
      <section className="relative w-full h-[88vh] min-h-[640px] flex items-end pb-16 overflow-hidden">
        {/* Edge-to-edge Cinema Backdrop */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out hover:scale-[1.01]"
          style={{
            backgroundImage: `url(${featuredTitle.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'})`
          }}
        />
        {/* Nocturne Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent w-full md:w-3/4" />

        {/* Ambient Nocturne Glow Blooms */}
        <div className="absolute bottom-1/4 left-16 w-[450px] h-[450px] rounded-full bg-electric-blue/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/4 right-20 w-[500px] h-[500px] rounded-full bg-violet/20 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/3 w-[350px] h-[350px] rounded-full bg-pink/10 blur-[130px] pointer-events-none" />

        {/* Lower-Left Editorial Content */}
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto pt-24">
          {/* Technical Master Indicator */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md text-on-surface-variant font-label-caps text-[10px] tracking-[0.2em] uppercase border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-pink shadow-[0_0_8px_#EC4899] animate-pulse" />
              Exclusive Premiere • 4K Dolby Cinema
            </span>
            <span className="hidden sm:inline-block font-label-caps text-[10px] text-secondary tracking-[0.16em] uppercase">
              Frame-Lock ±0.8ms
            </span>
          </div>

          {/* Hero Title with Nocturne Gradient */}
          <div className="max-w-4xl space-y-2">
            <h1 className="font-display-hero text-3xl sm:text-5xl lg:text-7xl tracking-tight text-white uppercase leading-none drop-shadow-2xl font-bold">
              Watch Together.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#EC4899]">
                Feel Every Moment.
              </span>
            </h1>
          </div>

          {/* Editorial Synopsis */}
          <p className="mt-4 max-w-2xl font-body-lg text-sm sm:text-base text-on-surface-variant leading-relaxed line-clamp-3">
            {featuredTitle.description || 'A cinematic social screening experience engineered for those who revere narrative craft. Synchronized to the millisecond across pristine temporal feeds.'}
          </p>

          {/* Action Triggers */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onOpenCreateModal(featuredTitle)}
              className="btn-primary-gradient inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-label-md text-xs tracking-wider uppercase font-bold shadow-[0_0_35px_rgba(37,99,235,0.5)] hover:shadow-[0_0_45px_rgba(236,72,153,0.7)] transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              <span>Create Watch Space</span>
            </button>

            <button
              onClick={() => onNavigateTab('discover')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#080D24]/70 hover:bg-[#111936] backdrop-blur-xl text-white font-label-md text-xs tracking-wider uppercase transition-all border border-white/10"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">theater_comedy</span>
              <span>Explore Repertory</span>
            </button>

            <button
              onClick={onQuickJoinDemo}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#080D24]/60 hover:bg-[#0D1535] text-secondary font-label-md text-xs tracking-wider uppercase transition-all border border-secondary/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Instant Demo</span>
            </button>
          </div>

          {/* Realtime Metadata Bar */}
          <div className="mt-8 flex items-center gap-4 text-on-surface-variant font-label-caps text-[10px] tracking-widest uppercase">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-blue shadow-[0_0_8px_#2563EB]" />
              <span>Real-time sync</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet" />
              <span>Private rooms</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink" />
              <span>AI-powered experience</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SECTION 1: CONTINUE WATCHING                          */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-label-caps text-[10px] tracking-[0.22em] text-secondary uppercase block mb-1">
              Temporal Feeds
            </span>
            <h2 className="font-display-hero text-2xl sm:text-4xl tracking-tight text-white font-bold">
              CONTINUE WATCHING
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-label-caps text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
            <span>Session Sync</span>
            <span className="text-white/20">•</span>
            <span className="text-white">Lossless Feed</span>
          </div>
        </div>

        {/* Asymmetrical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Primary Spotlight (lg:col-span-8) */}
          <div className="lg:col-span-8 group relative rounded-3xl overflow-hidden bg-[#080D24] min-h-[380px] md:min-h-[440px] flex flex-col justify-end p-6 sm:p-8 transition-all duration-700 hover:shadow-[0_0_80px_rgba(37,99,235,0.2)] border border-white/10">
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${history[0]?.thumbnailUrl || titles[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050712]/90 via-transparent to-transparent" />

            <div className="relative z-10 space-y-3 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-violet/20 text-secondary font-label-caps text-[9px] uppercase tracking-wider font-semibold border border-violet/30">
                  {history[0] ? 'Recent Session' : 'Spotlight Screening'}
                </span>
                <span className="text-on-surface-variant font-mono text-[10px]">
                  Paused at {history[0] ? `${Math.floor(history[0].watchedSeconds / 60)}m` : '08:45'}
                </span>
              </div>

              <h3 className="font-title-md text-2xl sm:text-3xl text-white font-bold tracking-tight">
                {history[0]?.titleName || titles[0]?.name || 'Cyberpunk 2099: Neo Nexus'}
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-on-surface-variant line-clamp-2">
                {titles[0]?.description || 'High fidelity co-watching calibrated with neural scene notes and Dolby Atmos spatial audio.'}
              </p>

              {/* Progress Bar with Electric Blue -> Violet */}
              <div className="w-full space-y-1 pt-2">
                <div className="w-full h-1.5 bg-[#111936] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-electric-blue to-violet rounded-full" 
                    style={{ width: `${history[0] ? Math.round((history[0].watchedSeconds / history[0].durationSeconds) * 100) : 68}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>{history[0] ? `${Math.floor(history[0].watchedSeconds / 60)}:00` : '08:45'}</span>
                  <span>{history[0] ? `${Math.floor(history[0].durationSeconds / 60)}:00` : '10:00'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => {
                    const match = titles.find(t => t.id === (history[0]?.titleId || titles[0]?.id));
                    if (match) onOpenCreateModal(match);
                  }}
                  className="px-6 py-2.5 rounded-full btn-primary-gradient font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  <span>Resume Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Companions (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            {titles.slice(1, 3).map((item, idx) => (
              <div 
                key={item.id}
                className="group relative flex-1 rounded-3xl overflow-hidden bg-[#080D24] min-h-[200px] p-5 flex flex-col justify-end transition-all duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.25)] border border-white/10 cursor-pointer"
                onClick={() => onOpenCreateModal(item)}
              >
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.thumbnailUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/60 to-transparent" />

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[9px] tracking-widest text-secondary uppercase font-semibold">
                      {item.genre || 'Cinema Master'}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {Math.floor(item.durationSeconds / 60)}m
                    </span>
                  </div>
                  <h4 className="font-title-md text-base text-white tracking-tight font-semibold">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-on-surface-variant text-xs">
                      {idx === 0 ? '4 friends in pause queue' : 'Spatial Sync Ready'}
                    </span>
                    <span className="font-label-md text-[10px] tracking-wider text-pink uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">play_circle</span>
                      Host
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SECTION 2: YOUR WATCH SPACES                          */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-2">
          <div>
            <span className="font-label-caps text-[10px] tracking-[0.22em] text-primary uppercase block mb-1">
              Spatial Nodes
            </span>
            <h2 className="font-display-hero text-2xl sm:text-4xl tracking-tight text-white font-bold">
              YOUR WATCH SPACES
            </h2>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
              Active private cinemas synchronized across global hubs right now.
            </p>
          </div>
          <button
            onClick={() => onOpenCreateModal()}
            className="inline-flex items-center gap-2 font-label-md text-xs tracking-wider text-secondary hover:text-white uppercase transition-colors"
          >
            <span>Architect New Room</span>
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeSpaces.length > 0 ? (
            activeSpaces.map((space) => (
              <div
                key={space.watchSpaceId}
                className="group relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#080D24] flex flex-col justify-between p-6 sm:p-8 transition-all duration-700 hover:scale-[1.01] border border-white/10 shadow-2xl"
              >
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${titles.find(t => t.id === space.titleId)?.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050712]/70 via-transparent to-transparent h-28" />

                {/* Top Tags */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-electric-blue text-white font-label-caps text-[9px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_#2563EB]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live Synced
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md text-on-surface-variant font-mono text-[10px] uppercase border border-white/10">
                      Code: {space.inviteCode}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-violet/30 text-secondary font-label-caps text-[9px] uppercase tracking-wider backdrop-blur-md border border-violet/30">
                    Host: {space.hostDisplayName}
                  </span>
                </div>

                {/* Bottom Specs & Action */}
                <div className="relative z-10 space-y-3">
                  <div>
                    <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest">
                      Private Screening • {space.activeParticipantsCount} Guests
                    </span>
                    <h3 className="font-title-md text-xl sm:text-2xl text-white font-bold tracking-tight">
                      {space.titleName}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {space.participants.slice(0, 4).map((p, pIdx) => (
                          <div 
                            key={p.userId || pIdx} 
                            className="w-7 h-7 rounded-full bg-[#111936] ring-2 ring-[#050712] flex items-center justify-center text-[10px] font-bold text-white uppercase"
                          >
                            {p.displayName.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant hidden sm:inline">
                        Spatial Voice On
                      </span>
                    </div>

                    <button
                      onClick={() => onJoinSpace(space.watchSpaceId)}
                      className="btn-primary-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md text-xs uppercase tracking-wider font-bold shadow-md"
                      type="button"
                    >
                      <span>Rejoin Room</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Fallback Demo Cards */}
              <div 
                onClick={() => onOpenCreateModal(titles[0])}
                className="group relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#080D24] flex flex-col justify-between p-6 sm:p-8 transition-all duration-700 hover:scale-[1.01] border border-white/10 shadow-2xl cursor-pointer"
              >
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{ backgroundImage: `url(${titles[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/60 to-transparent" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-electric-blue/20 text-bright-blue font-label-caps text-[9px] uppercase tracking-wider flex items-center gap-1.5 border border-electric-blue/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
                    Available Space
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">Vault #01</span>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-title-md text-2xl text-white font-bold">{titles[0]?.name || 'Neo Nexus Lounge'}</h3>
                  <p className="text-xs text-on-surface-variant">Launch an ultra-low latency synced co-watching theater now.</p>
                  <div className="pt-2">
                    <span className="btn-primary-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md text-xs uppercase font-bold">
                      Create Space
                    </span>
                  </div>
                </div>
              </div>

              <div 
                onClick={onQuickJoinDemo}
                className="group relative aspect-[16/9] rounded-3xl overflow-hidden bg-[#080D24] flex flex-col justify-between p-6 sm:p-8 transition-all duration-700 hover:scale-[1.01] border border-violet/30 shadow-2xl cursor-pointer"
              >
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                  style={{ backgroundImage: `url(${titles[1]?.thumbnailUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/60 to-transparent" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-violet/20 text-secondary font-label-caps text-[9px] uppercase tracking-wider flex items-center gap-1.5 border border-violet/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet" />
                    Demo Theater • Code NX-DEMO
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">Instant Access</span>
                </div>
                <div className="relative z-10 space-y-2">
                  <h3 className="font-title-md text-2xl text-white font-bold">{titles[1]?.name || 'Cosmos Deep: Odyssey'}</h3>
                  <p className="text-xs text-on-surface-variant">Jump directly into a simulated co-viewing space with live AI Co-Pilot.</p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high text-white font-label-md text-xs uppercase font-bold border border-white/10">
                      Enter Demo Theater
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SECTION 3: TRENDING CINEMA                            */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-label-caps text-[10px] tracking-[0.22em] text-secondary uppercase block mb-1">
              Curated Catalog
            </span>
            <h2 className="font-display-hero text-2xl sm:text-4xl tracking-tight text-white font-bold">
              TRENDING CINEMA
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('discover')}
            className="text-xs font-label-md uppercase tracking-wider text-secondary hover:text-white"
          >
            Browse Full Library →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {titles.map((title) => (
            <div
              key={title.id}
              className="glass-card rounded-3xl overflow-hidden flex flex-col justify-end p-5 transition-all duration-500 hover:-translate-y-2 border border-white/10"
            >
              <div 
                className="h-72 w-full -mx-5 -mt-5 mb-4 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${title.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'})` }}
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[9px] uppercase text-secondary tracking-wider font-semibold">
                    {title.genre || 'Sci-Fi'}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    {Math.floor(title.durationSeconds / 60)} min
                  </span>
                </div>
                <h3 className="font-title-md text-base text-white font-bold truncate">
                  {title.name}
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-2">
                  {title.description}
                </p>

                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => onOpenCreateModal(title)}
                    className="flex-1 py-2.5 rounded-full btn-primary-gradient font-label-md text-xs uppercase tracking-wider font-semibold shadow-md"
                  >
                    Start Space
                  </button>
                  <button
                    onClick={() => onSelectTitle(title)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-colors border border-white/10"
                    title="Solo Watch"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. SECTION 4: AI CURATOR RECOMMENDATIONS                 */}
      {/* ======================================================== */}
      {recommendations.length > 0 && (
        <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet/20 border border-violet/40 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] tracking-[0.22em] text-pink uppercase block mb-0.5">
                  Hybrid Grounded Neural Engine
                </span>
                <h2 className="font-display-hero text-2xl sm:text-4xl tracking-tight text-white font-bold">
                  AI FILM SCHOLAR PICKS
                </h2>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet/20 text-secondary font-mono text-[10px] uppercase border border-violet/30">
              Precision: 96% Match
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recommendations.map((rec) => (
              <div
                key={rec.titleId}
                className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center border border-white/10 hover:border-violet/40 transition-all duration-500 shadow-xl"
              >
                <div 
                  className="w-full sm:w-44 h-48 rounded-2xl bg-cover bg-center shrink-0 shadow-lg"
                  style={{ backgroundImage: `url(${rec.thumbnailUrl})` }}
                />
                <div className="flex flex-col justify-between flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[9px] uppercase text-secondary tracking-wider font-semibold">
                      {rec.genre}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-electric-blue/20 text-bright-blue font-mono text-[10px] font-bold border border-electric-blue/30">
                      {Math.round(rec.score * 100)}% Match
                    </span>
                  </div>

                  <h3 className="font-title-md text-xl text-white font-bold">
                    {rec.title}
                  </h3>

                  <div className="p-3 rounded-2xl bg-[#050712]/80 border border-white/5 text-xs text-on-surface-variant font-light">
                    <div className="text-secondary font-medium text-[11px] mb-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                      Curator Rationale:
                    </div>
                    {rec.reason}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const t = titles.find(x => x.id === rec.titleId);
                        if (t) onOpenCreateModal(t);
                      }}
                      className="px-6 py-2.5 rounded-full btn-primary-gradient font-label-md text-xs uppercase font-bold shadow-md"
                    >
                      Host Watch Space
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 6. CINEMATIC FOOTER                                      */}
      {/* ======================================================== */}
      <footer className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-28 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant text-xs gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-electric-blue via-violet to-pink flex items-center justify-center text-white font-bold text-[10px]">
            WS
          </div>
          <span className="font-mono text-[10px] tracking-widest uppercase">
            Watch Spaces • Nocturne Luminary Platform
          </span>
        </div>
        <div className="flex items-center gap-6 font-mono text-[10px] tracking-wider uppercase">
          <span>Dolby Atmos Mastered</span>
          <span>WebSocket Realtime Sync</span>
          <span>Grounded AI Co-Pilot</span>
        </div>
      </footer>
    </div>
  );
};
