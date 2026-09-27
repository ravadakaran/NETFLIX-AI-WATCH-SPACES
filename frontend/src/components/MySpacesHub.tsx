import React from 'react';
import { WatchSpace, HistoryItem, Title, User } from '../types';

interface MySpacesHubProps {
  currentUser: User | null;
  activeSpaces: WatchSpace[];
  history: HistoryItem[];
  titles: Title[];
  onOpenCreateModal: (title?: Title) => void;
  onOpenJoinModal: () => void;
  onJoinSpace: (spaceId: string) => void;
  onQuickJoinDemo: () => void;
}

export const MySpacesHub: React.FC<MySpacesHubProps> = ({
  currentUser,
  activeSpaces,
  history,
  titles,
  onOpenCreateModal,
  onOpenJoinModal,
  onJoinSpace,
  onQuickJoinDemo
}) => {
  return (
    <div className="w-full flex flex-col text-on-surface select-none pb-24 font-sans">
      {/* ======================================================== */}
      {/* PAGE HEADER (Nocturne Luminary)                           */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[550px] h-[550px] bg-electric-blue/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet/15 rounded-full blur-[160px] pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#8B5CF6]" />
              <span className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-secondary font-semibold">
                PERSONAL VAULT & ARCHIVE
              </span>
            </div>
            <h1 className="font-display-hero text-4xl sm:text-6xl text-white tracking-tight leading-none mb-3 font-bold">
              Your Watch Spaces<span className="text-pink">.</span>
            </h1>
            <p className="font-body-lg text-sm sm:text-base text-on-surface-variant max-w-2xl font-light leading-relaxed">
              Your private cinema rooms, shared watchlists, and synchronized circles—calibrated for master acoustics and pristine theater fidelity.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3 flex-wrap self-start lg:self-end">
            <button
              onClick={() => onOpenCreateModal()}
              className="btn-primary-gradient px-6 py-3 rounded-full font-label-md text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] flex items-center gap-2 font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create New Space</span>
            </button>
            <button
              onClick={onOpenJoinModal}
              className="px-5 py-3 rounded-full bg-[#080D24] hover:bg-[#111936] text-white font-label-md text-xs tracking-wider uppercase backdrop-blur-xl transition-all flex items-center gap-2 border border-white/10 font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">dialpad</span>
              <span>Join with Invite Code</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. CURRENTLY ACTIVE ROOMS                                */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-blue opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-blue shadow-[0_0_12px_#2563EB]" />
            </div>
            <span className="font-label-caps text-xs tracking-[0.18em] uppercase text-white font-bold">
              CURRENTLY STREAMING • LIVE SYNC
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase text-on-surface-variant">
            {activeSpaces.length} Synchronized Sessions
          </span>
        </div>

        {activeSpaces.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeSpaces.map((space) => {
              const matchedTitle = titles.find((t) => t.id === space.titleId);
              return (
                <article
                  key={space.watchSpaceId}
                  className="group relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-[#080D24] shadow-2xl flex flex-col justify-end p-6 sm:p-8 transition-transform duration-700 hover:scale-[1.015] border border-white/10"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${matchedTitle?.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/60 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050712]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Top Status Bar */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink shadow-[0_0_8px_#EC4899]" />
                      <span className="font-label-caps text-[9px] text-white uppercase tracking-wider">
                        IMAX 4K HDR • ATMOS
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase px-3 py-1 rounded-full bg-[#080D24]/60 backdrop-blur-md border border-white/5">
                      Code: {space.inviteCode}
                    </span>
                  </div>

                  {/* Foreground Content */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-secondary font-label-caps text-[9px] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[15px]">sensors</span>
                      <span>Playback Synced • Spatial Voice Active</span>
                    </div>
                    <h2 className="font-title-md text-2xl sm:text-3xl text-white font-bold tracking-tight">
                      {space.titleName}
                    </h2>
                    <p className="font-body-md text-xs text-on-surface-variant line-clamp-1 max-w-lg">
                      Host: {space.hostDisplayName} • {space.activeParticipantsCount} active guests in theater
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                      {/* Friend Avatars */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {space.participants.slice(0, 4).map((p, idx) => (
                            <div
                              key={p.userId || idx}
                              className="w-8 h-8 rounded-full bg-[#111936] ring-2 ring-[#050712] flex items-center justify-center text-xs font-bold text-white uppercase"
                            >
                              {p.displayName.slice(0, 2)}
                            </div>
                          ))}
                        </div>
                        <span className="font-mono text-[10px] text-on-surface-variant ml-1">
                          {space.activeParticipantsCount} in Room
                        </span>
                      </div>

                      <button
                        onClick={() => onJoinSpace(space.watchSpaceId)}
                        className="btn-primary-gradient px-5 py-2.5 rounded-full font-label-md text-xs tracking-wider uppercase shadow-md flex items-center gap-2 font-bold"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>Rejoin Room</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#080D24] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1">
              <h3 className="font-title-md text-xl text-white font-bold">No active rooms at the moment</h3>
              <p className="text-xs text-on-surface-variant">Launch your private watch space with lossless sync, or join a friend's room.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenCreateModal()}
                className="btn-primary-gradient px-5 py-2.5 rounded-full font-label-md text-xs uppercase font-bold shadow-md"
              >
                Create Room
              </button>
              <button
                onClick={onQuickJoinDemo}
                className="px-5 py-2.5 rounded-full bg-[#111936] text-secondary font-label-md text-xs uppercase font-bold border border-secondary/30"
              >
                Join Demo Room
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 2. SCHEDULED WATCH PARTIES                               */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
          <div>
            <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">
              CALIBRATED CALENDAR
            </span>
            <h2 className="font-display-hero text-2xl sm:text-3xl text-white tracking-tight mt-1 font-bold">
              Scheduled Watch Parties
            </h2>
          </div>
          <p className="font-body-md text-xs text-on-surface-variant max-w-md">
            Synchronizations confirmed across time zones. Pre-roll theater lobbies open 15 minutes prior to curtain call.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="glass-card rounded-3xl p-6 overflow-hidden flex flex-col justify-between border border-white/10">
            <div className="h-44 w-full rounded-2xl overflow-hidden relative mb-4">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md font-label-caps text-[9px] uppercase text-pink tracking-wider font-semibold border border-pink/30">
                TONIGHT • 21:00 EST
              </div>
            </div>
            <div className="flex flex-col flex-grow">
              <span className="font-label-caps text-[9px] tracking-wider text-muted-text uppercase mb-1">
                PRESTIGE DRAMA SYNDICATE
              </span>
              <h3 className="font-title-md text-lg text-white font-bold tracking-tight mb-2">
                Cyberpunk 2099: Neon Syndicate
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 mb-4">
                Interactive narrative voting branch session. Master uncompressed 5.1 vocal track.
              </p>
            </div>
            <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-muted-text font-mono">Host: Cinema Guild</span>
              <button
                onClick={() => onOpenCreateModal(titles[0])}
                className="text-xs text-secondary hover:text-white uppercase font-bold flex items-center gap-1"
              >
                <span>RSVP</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </article>

          <article className="glass-card rounded-3xl p-6 overflow-hidden flex flex-col justify-between border border-white/10">
            <div className="h-44 w-full rounded-2xl overflow-hidden relative mb-4">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md font-label-caps text-[9px] uppercase text-electric-blue tracking-wider font-semibold border border-electric-blue/30">
                TOMORROW • 20:30 UTC
              </div>
            </div>
            <div className="flex flex-col flex-grow">
              <span className="font-label-caps text-[9px] tracking-wider text-muted-text uppercase mb-1">
                COSMOS DOCUMENTARY CIRCLE
              </span>
              <h3 className="font-title-md text-lg text-white font-bold tracking-tight mb-2">
                Cosmos Deep: Andromeda
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 mb-4">
                AI Film Scholar live timeline commentary on exoplanetary astrophotography.
              </p>
            </div>
            <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-muted-text font-mono">Host: Documentary Circle</span>
              <button
                onClick={() => onOpenCreateModal(titles[1])}
                className="text-xs text-secondary hover:text-white uppercase font-bold flex items-center gap-1"
              >
                <span>RSVP</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </article>

          <article className="glass-card rounded-3xl p-6 overflow-hidden flex flex-col justify-between border border-white/10">
            <div className="h-44 w-full rounded-2xl overflow-hidden relative mb-4">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-transparent to-transparent" />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#080D24]/80 backdrop-blur-md font-label-caps text-[9px] uppercase text-violet tracking-wider font-semibold border border-violet/30">
                SATURDAY • 22:00 EST
              </div>
            </div>
            <div className="flex flex-col flex-grow">
              <span className="font-label-caps text-[9px] tracking-wider text-muted-text uppercase mb-1">
                AUTEUR CINEMA RETROSPECTIVE
              </span>
              <h3 className="font-title-md text-lg text-white font-bold tracking-tight mb-2">
                Chongqing Expressive Masters
              </h3>
              <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 mb-4">
                35mm transfer evaluation with synchronous multi-channel spatial audio.
              </p>
            </div>
            <div className="pt-2 mt-auto border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-muted-text font-mono">Host: Auteur Society</span>
              <button
                onClick={() => onOpenCreateModal(titles[0])}
                className="text-xs text-secondary hover:text-white uppercase font-bold flex items-center gap-1"
              >
                <span>RSVP</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. PAST WATCH ARCHIVES                                   */}
      {/* ======================================================== */}
      {history.length > 0 && (
        <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-secondary font-semibold">
                SESSION TELEMETRY
              </span>
              <h2 className="font-display-hero text-2xl sm:text-3xl text-white tracking-tight mt-1 font-bold">
                Past Watch Archives
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-on-surface-variant">
              {history.length} Saved Logs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-[#080D24] p-5 border border-white/10 flex items-center gap-4 hover:border-violet/40 transition-colors"
              >
                <div 
                  className="w-20 h-20 rounded-2xl bg-cover bg-center shrink-0 shadow-md"
                  style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
                />
                <div className="flex-1 space-y-1">
                  <h4 className="font-title-md text-sm text-white font-bold truncate">
                    {item.titleName}
                  </h4>
                  <div className="text-[10px] text-muted-text font-mono">
                    Watched: {Math.floor(item.watchedSeconds / 60)} / {Math.floor(item.durationSeconds / 60)} min
                  </div>
                  <div className="w-full h-1 bg-[#111936] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-electric-blue to-violet"
                      style={{ width: `${Math.round((item.watchedSeconds / item.durationSeconds) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-text pt-1">
                    <span>{item.completed ? 'Completed' : 'Partial Session'}</span>
                    {item.rating && <span className="text-secondary font-semibold">★ {item.rating}/5</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
