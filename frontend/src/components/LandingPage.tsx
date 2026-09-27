import React from 'react';
import { Title, WatchSpace } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  titles: Title[];
  activeSpaces: WatchSpace[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  titles,
  activeSpaces
}) => {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col font-sans select-none">
      {/* ======================================================== */}
      {/* 1. FLOATING MINIMAL HEADER                                */}
      {/* ======================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="w-full bg-[#080D24]/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-electric-blue shadow-[0_0_10px_#2563EB] animate-pulse" />
                <span className="font-title-md text-white tracking-tight font-bold text-base">
                  Watch Spaces
                </span>
              </div>
              <span className="hidden sm:inline-block font-label-caps text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary tracking-widest border border-white/5">
                Cinema Sync
              </span>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-label-md text-on-surface-variant hover:text-white uppercase tracking-wider transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-xs font-label-md text-on-surface-variant hover:text-white uppercase tracking-wider transition-colors">
                How It Works
              </a>
              <a href="#repertory" className="text-xs font-label-md text-on-surface-variant hover:text-white uppercase tracking-wider transition-colors">
                Repertory
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onSignIn}
                className="text-xs font-label-md text-on-surface-variant hover:text-white px-4 py-2 rounded-full transition-colors uppercase tracking-wider"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="btn-primary-gradient text-xs font-label-md uppercase tracking-wider px-5 py-2.5 rounded-full font-bold flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. FULLSCREEN CINEMATIC HERO (Nocturne Luminary)         */}
      {/* ======================================================== */}
      <section className="relative w-full min-h-[92vh] flex items-end pt-36 pb-20 px-4 sm:px-8 lg:px-14 overflow-hidden bg-surface-container-lowest">
        {/* Full-bleed Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Watch Spaces hero cinema experience"
            className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.1] scale-105 transform origin-center transition-transform duration-1000 ease-out"
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2000&q=80"
          />
          {/* Atmospheric Multi-Axis Scrim Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent w-full lg:w-3/4" />
          
          {/* Nocturne Glow Blooms: Electric Blue, Violet, Soft Pink */}
          <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-electric-blue/20 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-[550px] h-[550px] rounded-full bg-violet/25 blur-[160px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-pink/15 blur-[130px] pointer-events-none" />
        </div>

        {/* Hero Content Vessel */}
        <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col gap-6">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#080D24]/80 backdrop-blur-xl w-fit border border-white/10 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink" />
            </span>
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-primary font-semibold">
              Private Screening Protocol
            </span>
            <span className="text-white/20 font-mono">•</span>
            <span className="font-label-md text-[11px] text-on-surface-variant font-medium">
              Spatial Audio Ready
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="font-display-hero text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight uppercase max-w-4xl drop-shadow-2xl font-bold leading-tight">
              Watch together.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#EC4899]">
                Feel every moment.
              </span>
            </h1>
            <p className="font-headline-md text-lg sm:text-2xl text-primary font-normal tracking-normal max-w-2xl">
              A cinematic way to watch movies and shows with the people you care about.
            </p>
          </div>

          <p className="font-body-lg text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Create private Watch Spaces, invite your friends, stay perfectly synchronized across temporal feeds, chat in real time, and let grounded AI understand what you're watching together.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="btn-primary-gradient px-8 py-3.5 rounded-full font-label-md text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-[0_0_36px_rgba(37,99,235,0.45)] hover:shadow-[0_0_48px_rgba(236,72,153,0.55)] transition-all"
            >
              <span>GET STARTED</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={onSignIn}
              className="px-8 py-3.5 rounded-full bg-surface-container-high/60 backdrop-blur-xl font-label-md text-xs uppercase tracking-wider text-white hover:bg-surface-bright/70 transition-all border border-white/10"
            >
              SIGN IN
            </button>
          </div>

          {/* Realtime Synchronized Telemetry List */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-8 text-on-surface-variant font-label-md text-xs pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
              <span>Synchronized playback (±0.8ms)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet" />
              <span>Spatial acoustic channels</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink" />
              <span>AI-grounded film scholar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. FEATURES SECTION (Architected for Connection)         */}
      {/* ======================================================== */}
      <section id="features" className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto py-24">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="font-label-caps text-[10px] uppercase tracking-[0.25em] text-secondary font-semibold">
            ENGINEERED FIDELITY
          </span>
          <h2 className="font-display-hero text-3xl sm:text-5xl text-white font-bold tracking-tight">
            Architected for Cinematic Connection
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant">
            Built from first principles for cinema enthusiasts, study circles, and remote watch parties that refuse to compromise on fidelity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-electric-blue/15 border border-electric-blue/30 flex items-center justify-center text-electric-blue group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">sync_saved_locally</span>
            </div>
            <h3 className="font-title-md text-xl text-white font-bold">
              Millisecond Playback Lock
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Proprietary WebSocket heartbeat drift correction continuously aligns every peer's video timeline down to individual video frames.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-violet/15 border border-violet/30 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <h3 className="font-title-md text-xl text-white font-bold">
              Grounded AI Film Scholar
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Timeline-anchored intelligent co-pilot analyzes cinematography, reveals trivia, and explains thematic motifs without disturbing playback.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-8 space-y-4 relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-pink/15 border border-pink/30 flex items-center justify-center text-pink group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">alt_route</span>
            </div>
            <h3 className="font-title-md text-xl text-white font-bold">
              Interactive Story Branching
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Audience members cast live votes at key narrative variation points, dynamically deciding characters' fates in real time.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. HOW IT WORKS                                          */}
      {/* ======================================================== */}
      <section id="how-it-works" className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto py-16">
        <div className="rounded-3xl bg-[#080D24]/70 border border-white/10 p-8 sm:p-14 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
              SEAMLESS FLOW
            </span>
            <h2 className="font-display-hero text-2xl sm:text-4xl text-white font-bold">
              How Watch Spaces Operates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-electric-blue text-white font-mono font-bold flex items-center justify-center text-lg shadow-[0_0_20px_#2563EB]">
                1
              </div>
              <h4 className="font-title-md text-base text-white font-semibold">Create or Join a Space</h4>
              <p className="text-xs text-on-surface-variant">Pick a title from the repertory or enter a 6-digit room token.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet text-white font-mono font-bold flex items-center justify-center text-lg shadow-[0_0_20px_#7C3AED]">
                2
              </div>
              <h4 className="font-title-md text-base text-white font-semibold">Lock into Synchronous Feed</h4>
              <p className="text-xs text-on-surface-variant">Your player automatically synchronizes with the host's timeline.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-pink text-white font-mono font-bold flex items-center justify-center text-lg shadow-[0_0_20px_#EC4899]">
                3
              </div>
              <h4 className="font-title-md text-base text-white font-semibold">Engage with AI & Friends</h4>
              <p className="text-xs text-on-surface-variant">Chat, float reaction emojis, vote on plot branches, and query the AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto py-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-on-surface-variant text-xs gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-electric-blue" />
          <span className="text-white font-bold">Watch Spaces</span>
          <span>• Nocturne Luminary Cinematic Platform</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onSignIn} className="hover:text-white transition-colors">Sign In</button>
          <button onClick={onGetStarted} className="hover:text-white transition-colors">Get Started</button>
          <span>Privacy & Spatial Security</span>
        </div>
      </footer>
    </div>
  );
};
