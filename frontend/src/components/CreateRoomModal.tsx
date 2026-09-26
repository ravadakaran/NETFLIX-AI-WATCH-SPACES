import React, { useState } from 'react';
import { Title } from '../types';
import { Users, X, Sparkles, Check } from 'lucide-react';

interface CreateRoomModalProps {
  titles: Title[];
  initialTitle?: Title;
  onClose: () => void;
  onCreate: (titleId: string, maxParticipants: number, aiVerbosity: string, votingEnabled: boolean) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  titles,
  initialTitle,
  onClose,
  onCreate
}) => {
  const [selectedTitleId, setSelectedTitleId] = useState<string>(initialTitle?.id || (titles[0]?.id || ''));
  const [maxParticipants, setMaxParticipants] = useState<number>(25);
  const [aiVerbosity, setAiVerbosity] = useState<string>('normal');
  const [votingEnabled, setVotingEnabled] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTitleId) return;
    onCreate(selectedTitleId, maxParticipants, aiVerbosity, votingEnabled);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '520px',
        borderRadius: '12px',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Users size={24} color="#E50914" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Create a Watch Space</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Start an authoritative synchronized room with your friends, live grounded AI co-pilot, and scene polls.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Select Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Select Title
            </label>
            <select
              value={selectedTitleId}
              onChange={(e) => setSelectedTitleId(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {titles.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#1c1c1c' }}>
                  {t.name} ({t.genre})
                </option>
              ))}
            </select>
          </div>

          {/* Participant Limit */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Max Capacity: {maxParticipants} Viewers
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-red)' }}
            />
          </div>

          {/* AI Verbosity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              AI Co-Pilot Verbosity
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {['low', 'normal', 'high'].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAiVerbosity(v)}
                  style={{
                    background: aiVerbosity === v ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: aiVerbosity === v ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: aiVerbosity === v ? '#00F0FF' : 'var(--text-muted)',
                    borderRadius: '6px',
                    padding: '8px 0',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Narrative Voting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Narrative Voting</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Allows audience to vote on interactive timeline variation moments
              </div>
            </div>
            <input
              type="checkbox"
              checked={votingEnabled}
              onChange={(e) => setVotingEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-red)' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-netflix"
              style={{ flex: 2 }}
            >
              Launch Watch Space 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
