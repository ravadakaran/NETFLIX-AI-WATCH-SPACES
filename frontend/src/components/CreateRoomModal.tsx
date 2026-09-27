import React, { useState } from 'react';
import { Title } from '../types';

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

  const currentTitle = titles.find(t => t.id === selectedTitleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#080D24]/95 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric-blue shadow-[0_0_8px_#2563EB]" />
            <span className="font-label-sm text-[10px] tracking-[0.2em] text-pink-300 uppercase font-semibold">
              AUTHORITATIVE HOST DECK
            </span>
          </div>
          <h2 className="font-title-md text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Create Watch Space
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            Start a synchronized cinema room with millisecond playback lock, live grounded AI Film Scholar, and interactive voting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select Title */}
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2 font-label-md">
              Selected Cinema Title
            </label>
            <div className="relative">
              <select
                value={selectedTitleId}
                onChange={(e) => setSelectedTitleId(e.target.value)}
                className="w-full appearance-none bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                {titles.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#080D24]">
                    {t.name} ({t.genre || 'Cinema'}) • {Math.floor(t.durationSeconds / 60)} min
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            {currentTitle && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-[#0D1535]/60 border border-white/5">
                <div 
                  className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 shadow-md"
                  style={{ backgroundImage: `url(${currentTitle.thumbnailUrl})` }}
                />
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{currentTitle.name}</div>
                  <div className="text-[10px] text-on-surface-variant line-clamp-1">{currentTitle.description}</div>
                </div>
              </div>
            )}
          </div>

          {/* Max Participants Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-label-md">
                Max Theater Capacity
              </label>
              <span className="font-mono text-xs text-pink-300 font-bold">
                {maxParticipants} Viewers
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mt-1">
              <span>2 (Intimate)</span>
              <span>25 (Standard)</span>
              <span>50 (Grand Premier)</span>
            </div>
          </div>

          {/* AI Verbosity Selector */}
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2 font-label-md">
              AI Film Scholar Verbosity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'minimal', label: 'Minimal', desc: 'Rare pivotal trivia' },
                { id: 'normal', label: 'Balanced', desc: 'Scene analysis & motifs' },
                { id: 'verbose', label: 'Deep Dive', desc: 'Continuous cinephile notes' }
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setAiVerbosity(v.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiVerbosity === v.id
                      ? 'bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 border-violet-400 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                      : 'bg-[#0D1535]/60 border-white/5 text-on-surface-variant hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{v.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-80">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Narrative Voting Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0D1535]/60 border border-white/5">
            <div>
              <div className="text-xs font-semibold text-white">Interactive Narrative Branching</div>
              <div className="text-[10px] text-on-surface-variant">Allow audience to vote on alternate scenes and plot branches</div>
            </div>
            <button
              type="button"
              onClick={() => setVotingEnabled(!votingEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                votingEnabled ? 'bg-gradient-to-r from-blue-600 to-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  votingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              <span>Launch Watch Space</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
