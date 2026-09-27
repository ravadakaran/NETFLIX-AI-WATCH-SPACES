import React, { useState } from 'react';

interface JoinRoomModalProps {
  onClose: () => void;
  onJoin: (code: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ onClose, onJoin }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onJoin(code.trim().toUpperCase());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCode(text.trim().toUpperCase());
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#080D24]/95 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
            <span className="font-label-sm text-[10px] tracking-[0.2em] text-pink-300 uppercase font-semibold">
              PRIVATE ACCESS PORTAL
            </span>
          </div>
          <h2 className="font-title-md text-2xl text-white font-bold tracking-tight">
            Join with Invite Code
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            Enter the 6-character room token provided by your host to join their synchronous screening stream.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2 font-label-md">
              Room Token
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. NX-DEMO or A1B2C3"
                className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest uppercase focus:outline-none focus:border-violet-500 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-pink-300 font-mono uppercase"
              >
                Paste
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1535]/60 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Don't have a code?</span>
            <button
              type="button"
              onClick={() => onJoin('NX-DEMO')}
              className="text-pink-300 hover:text-white uppercase font-bold text-[11px]"
            >
              Use Demo: NX-DEMO
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!code.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>Enter Watch Space</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
