import React, { useState, useMemo } from 'react';
import { Title, User } from '../types';

interface DiscoverProps {
  currentUser: User | null;
  titles: Title[];
  onOpenCreateModal: (title?: Title) => void;
  onSelectTitle: (title: Title) => void;
}

export const Discover: React.FC<DiscoverProps> = ({
  currentUser,
  titles,
  onOpenCreateModal,
  onSelectTitle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const genres = ['All', 'Sci-Fi', 'Documentary', 'Drama', 'A24 Psychological', '70mm Panavision'];

  const filteredTitles = useMemo(() => {
    return titles.filter((t) => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.genre && t.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre = selectedGenre === 'All' || (t.genre && t.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
      return matchesSearch && matchesGenre;
    });
  }, [titles, searchQuery, selectedGenre]);

  const spotlightTitle = titles[0] || {
    id: 't_cyberpunk',
    name: 'Cyberpunk 2099: Neo Nexus',
    description: 'An AI investigator and undercover detective uncover a conspiracy that threatens synthetic intelligence across dystopian megacities.',
    genre: 'Sci-Fi',
    durationSeconds: 600,
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'
  };

  return (
    <div className="w-full flex flex-col text-on-surface select-none pb-24 font-sans">
      {/* ======================================================== */}
      {/* 1. EDITORIAL HEADER & DISCOVERY BAR (Nocturne Luminary)  */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto pt-10 pb-8 flex flex-col items-start relative">
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-electric-blue/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[480px] h-[320px] bg-violet/15 rounded-full blur-[160px] pointer-events-none" />

        <div className="flex flex-col gap-2 max-w-4xl z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink shadow-[0_0_12px_#EC4899] animate-pulse" />
            <span className="font-label-caps text-[10px] tracking-[0.25em] text-secondary uppercase font-semibold">
              CURATED REPERTORY • EDITION NO. 44
            </span>
          </div>
          <h1 className="font-display-hero text-4xl sm:text-6xl text-white tracking-tight uppercase font-bold">
            DISCOVER
          </h1>
          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant font-light max-w-2xl">
            Find something worth experiencing together. Synced in flawless fidelity across private acoustic rooms.
          </p>
        </div>

        {/* Floating Translucent Glass Search Bar */}
        <div className="w-full mt-8 z-10 flex flex-col gap-4">
          <div className="w-full max-w-4xl bg-[#080D24]/80 backdrop-blur-2xl px-6 py-3.5 rounded-full flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 focus-within:border-electric-blue transition-all">
            <div className="flex items-center gap-4 flex-1">
              <span className="material-symbols-outlined text-electric-blue text-[22px]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white font-body-md text-sm placeholder:text-muted-text focus:outline-none"
                placeholder="Search titles, directors, technical film stocks, soundscapes..."
                type="text"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-on-surface-variant hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#111936] text-on-surface-variant font-mono text-[10px] border border-white/5">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>

          {/* Genre / Mood Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-4xl">
            <span className="font-label-caps text-[10px] text-muted-text uppercase tracking-widest pr-2 shrink-0">
              Aura:
            </span>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-label-md tracking-wider uppercase transition-all duration-200 border ${
                  selectedGenre === genre
                    ? 'btn-primary-gradient text-white font-bold border-transparent shadow-[0_0_16px_rgba(37,99,235,0.4)]'
                    : 'bg-[#080D24] hover:bg-[#111936] text-on-surface-variant hover:text-white border-white/5'
                }`}
                type="button"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. FEATURED EDITORIAL SPOTLIGHT (Nocturne Luminary)      */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-6">
        <div className="relative w-full rounded-3xl overflow-hidden min-h-[500px] md:min-h-[580px] flex items-end shadow-[0_30px_90px_rgba(0,0,0,0.85)] border border-white/10">
          <div 
            className="absolute inset-0 bg-cover bg-center w-full h-full transform transition-transform duration-1000 ease-out hover:scale-105"
            style={{
              backgroundImage: `url(${spotlightTitle.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/80 via-30% via-transparent to-[#050712]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050712]/90 via-[#050712]/40 to-transparent pointer-events-none" />

          {/* Top Badge */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#080D24]/80 backdrop-blur-xl border border-white/10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-electric-blue shadow-[0_0_10px_#2563EB] animate-pulse" />
            <span className="font-label-caps text-[10px] tracking-wider uppercase text-white font-bold">
              420 Circles Synced Now
            </span>
          </div>

          {/* Content Matrix */}
          <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-3xl flex flex-col items-start gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet/20 text-secondary text-[10px] font-label-caps tracking-wider uppercase backdrop-blur-md border border-violet/30">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>Critics Consensus 98%</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#111936] text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase border border-white/5">
                IMAX 4K Sync
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#111936] text-on-surface-variant font-label-caps text-[10px] tracking-wider uppercase border border-white/5">
                Dolby Atmos
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-display-hero text-3xl sm:text-5xl text-white font-bold tracking-tight uppercase leading-none">
                {spotlightTitle.name}
              </h2>
              <div className="flex items-center gap-3 text-on-surface-variant font-label-md text-xs uppercase tracking-wider mt-1">
                <span className="text-secondary font-medium">{spotlightTitle.genre || 'Epic Sci-Fi'}</span>
                <span>•</span>
                <span>{Math.floor(spotlightTitle.durationSeconds / 60)} min</span>
                <span>•</span>
                <span className="text-electric-blue font-semibold">Dolby Vision 4K</span>
              </div>
            </div>

            <p className="font-body-lg text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed line-clamp-3">
              {spotlightTitle.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onOpenCreateModal(spotlightTitle)}
                className="btn-primary-gradient flex items-center gap-2 px-7 py-3 rounded-full font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                <span>Start Watch Space</span>
              </button>
              <button
                onClick={() => onSelectTitle(spotlightTitle)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-high/60 hover:bg-surface-bright text-white font-label-md text-xs uppercase tracking-wider backdrop-blur-xl border border-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Solo Screening</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CATALOG GRID                                          */}
      {/* ======================================================== */}
      <section className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto mt-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase font-semibold">
              CATALOG REPERTORY ({filteredTitles.length})
            </span>
          </div>
        </div>

        {filteredTitles.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-[#080D24] rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
            <p className="text-white font-medium">No titles match "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
              className="text-xs text-secondary underline uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTitles.map((title) => (
              <div
                key={title.id}
                className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between p-5 transition-all duration-500 hover:-translate-y-2 border border-white/10"
              >
                <div>
                  <div 
                    className="h-64 w-full -mx-5 -mt-5 mb-4 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${title.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'})` }}
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-caps text-[9px] uppercase text-secondary tracking-wider font-semibold">
                      {title.genre || 'Cinema Master'}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {Math.floor(title.durationSeconds / 60)} min
                    </span>
                  </div>
                  <h3 className="font-title-md text-base text-white font-bold truncate">
                    {title.name}
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 mt-1">
                    {title.description}
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-2 mt-auto">
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
