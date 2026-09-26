import React, { useState } from 'react';
import { User } from '../types';
import { Play, Sparkles, Shield, Plus, Home, Compass, Radio } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'landing' | 'browse' | 'recommendations' | 'admin' | 'room';
  setActiveTab: (tab: 'landing' | 'browse' | 'recommendations' | 'admin') => void;
  onQuickJoin: (code: string) => void;
  onOpenCreateModal: () => void;
  onSwitchUser: (email: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onQuickJoin,
  onOpenCreateModal,
  onSwitchUser
}) => {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onQuickJoin(joinCode.trim());
      setJoinCode('');
    }
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(14, 14, 18, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '12px 36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px'
    }}>
      {/* Brand Logo & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div 
          onClick={() => setActiveTab('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #E50914 0%, #B81D24 100%)',
            color: 'white',
            fontWeight: 900,
            fontSize: '1.4rem',
            padding: '2px 10px',
            borderRadius: '4px',
            letterSpacing: '1px',
            boxShadow: '0 0 15px rgba(229, 9, 20, 0.5)'
          }}>
            N
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px' }}>NETFLIX</span>
            <span style={{
              marginLeft: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #00F0FF, #B026FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>AI WATCH SPACES</span>
          </div>
        </div>

        {/* Tab Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('landing')}
            style={{
              background: activeTab === 'landing' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'landing' ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Home size={15} /> Overview
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            style={{
              background: activeTab === 'browse' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: activeTab === 'browse' ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Compass size={15} /> Catalog & Spaces
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            style={{
              background: activeTab === 'recommendations' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
              color: activeTab === 'recommendations' ? '#00F0FF' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={15} color="#00F0FF" /> Recommended AI
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                background: activeTab === 'admin' ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                color: activeTab === 'admin' ? '#FF4D4D' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Shield size={15} color="#E50914" /> Admin Timeline
            </button>
          )}
        </div>
      </div>

      {/* Actions & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Join Input */}
        <form onSubmit={handleJoinSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Invite code (e.g. NX-DEMO)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
              width: '180px'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              padding: '8px 14px',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Join
          </button>
        </form>

        {/* Create Space Button */}
        <button
          onClick={onOpenCreateModal}
          className="btn-netflix"
          style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
          <Plus size={16} /> Host Room
        </button>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '16px' }}>
          <select
            value={currentUser?.email || ''}
            onChange={(e) => onSwitchUser(e.target.value)}
            style={{
              background: 'rgba(22, 22, 28, 0.95)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="host@example.com">👑 Alex Host (HOST)</option>
            <option value="viewer@example.com">🍿 Sam Viewer (VIEWER)</option>
            <option value="admin@example.com">🛡️ System Admin (ADMIN)</option>
          </select>
        </div>
      </div>
    </nav>
  );
};
