import React, { useState } from 'react';
import { User } from '../types';

export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'WS';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  hasActiveSpace?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenLogin,
  onLogout,
  hasActiveSpace
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-500 px-4 sm:px-8 pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="w-full bg-[#080D24]/85 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-electric-blue via-violet to-pink shadow-[0_0_18px_rgba(37,99,235,0.6)] group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-xs tracking-[0.25em] text-white uppercase font-bold">
                WATCH SPACES
              </span>
              <span className="font-label-caps text-[9px] tracking-[0.16em] text-secondary -mt-0.5 uppercase">
                Cinema Sync
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`font-label-md text-xs uppercase tracking-[0.16em] transition-all duration-300 ${
                activeTab === 'home'
                  ? 'text-white font-bold drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] border-b-2 border-electric-blue pb-0.5'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`font-label-md text-xs uppercase tracking-[0.16em] transition-all duration-300 ${
                activeTab === 'discover'
                  ? 'text-white font-bold drop-shadow-[0_0_12px_rgba(124,58,237,0.8)] border-b-2 border-violet pb-0.5'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('spaces')}
              className={`font-label-md text-xs uppercase tracking-[0.16em] transition-all duration-300 ${
                activeTab === 'spaces'
                  ? 'text-white font-bold drop-shadow-[0_0_12px_rgba(236,72,153,0.8)] border-b-2 border-pink pb-0.5'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              My Spaces
            </button>
            {hasActiveSpace && (
              <button
                onClick={() => setActiveTab('room')}
                className={`flex items-center gap-1.5 font-label-md text-xs uppercase tracking-[0.16em] px-3.5 py-1 rounded-full bg-violet/20 border border-violet/40 text-secondary transition-all duration-300 ${
                  activeTab === 'room'
                    ? 'bg-gradient-to-r from-electric-blue via-violet to-pink text-white shadow-[0_0_20px_rgba(124,58,237,0.7)]'
                    : 'hover:bg-violet/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" />
                Live Theater
              </button>
            )}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`font-label-md text-xs uppercase tracking-[0.16em] transition-all duration-300 ${
                  activeTab === 'admin'
                    ? 'text-white font-bold border-b-2 border-secondary pb-0.5'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                Admin
              </button>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('discover')}
              className="text-on-surface-variant hover:text-white transition-colors p-2 flex items-center justify-center rounded-full hover:bg-white/5"
              title="Search Catalog"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full btn-primary-gradient font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Space</span>
            </button>

            {/* Authenticated User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full border border-white/10 hover:border-violet/50 transition-all bg-[#0D1535] hover:bg-[#111936] text-left"
                type="button"
              >
                {currentUser?.avatarUrl || currentUser?.profileImage ? (
                  <img
                    src={currentUser.avatarUrl || currentUser.profileImage}
                    alt={currentUser.displayName || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-violet-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-electric-blue via-violet to-pink flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                    {getInitials(currentUser?.displayName)}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold text-white max-w-[130px] truncate">
                  {currentUser?.displayName || 'Account'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  expand_more
                </span>
              </button>

              {isProfileOpen && (
                <div 
                  className="absolute right-0 mt-3 w-72 rounded-3xl bg-[#080D24] border border-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setIsProfileOpen(false)}
                >
                  {/* Authenticated User Identity */}
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    {currentUser?.avatarUrl || currentUser?.profileImage ? (
                      <img
                        src={currentUser.avatarUrl || currentUser.profileImage}
                        alt={currentUser.displayName || 'Profile'}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-violet-500/50 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-electric-blue via-violet to-pink flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-[0_0_14px_rgba(124,58,237,0.5)] shrink-0">
                        {getInitials(currentUser?.displayName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {currentUser?.displayName || 'Authenticated User'}
                      </div>
                      {currentUser?.email && (
                        <div className="text-xs text-on-surface-variant font-mono truncate">
                          {currentUser.email}
                        </div>
                      )}
                      {currentUser?.role && (
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet/20 border border-violet-500/30 text-pink font-label-caps text-[9px] uppercase tracking-wider font-semibold">
                          ROLE: {currentUser.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Navigation Options */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-on-surface hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                      <span className="font-medium">Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-on-surface hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">settings</span>
                      <span className="font-medium">Settings</span>
                    </button>

                    {currentUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-on-surface hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-pink">admin_panel_settings</span>
                        <span className="font-medium">Admin Console</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Option */}
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-pink hover:bg-pink/10 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-on-surface-variant hover:text-white p-2"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-[#080D24]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="text-left py-2 font-label-md uppercase tracking-wider text-white"
            >
              Home
            </button>
            <button
              onClick={() => { setActiveTab('discover'); setMobileMenuOpen(false); }}
              className="text-left py-2 font-label-md uppercase tracking-wider text-white"
            >
              Discover
            </button>
            <button
              onClick={() => { setActiveTab('spaces'); setMobileMenuOpen(false); }}
              className="text-left py-2 font-label-md uppercase tracking-wider text-white"
            >
              My Spaces
            </button>
            {hasActiveSpace && (
              <button
                onClick={() => { setActiveTab('room'); setMobileMenuOpen(false); }}
                className="text-left py-2 font-label-md uppercase tracking-wider text-secondary flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-pink animate-pulse" />
                Live Theater
              </button>
            )}
            <button
              onClick={() => { onOpenCreateModal(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-full btn-primary-gradient text-white font-label-md uppercase text-center font-bold"
            >
              Create Watch Space
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
