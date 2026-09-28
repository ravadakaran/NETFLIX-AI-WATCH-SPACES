import React, { useState } from 'react';
import { User } from '../types';

interface ProfileSettingsModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdate: (data: { displayName?: string; subtitleLocale?: string; password?: string }) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  currentUser,
  onClose,
  onUpdate
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [subtitleLocale, setSubtitleLocale] = useState(currentUser.subtitleLocale || 'en-US');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data: { displayName?: string; subtitleLocale?: string; password?: string } = {};

    if (displayName !== currentUser.displayName) {
      if (displayName.trim().length < 2) {
        setError('Display Name must be at least 2 characters.');
        return;
      }
      data.displayName = displayName;
    }

    if (subtitleLocale !== currentUser.subtitleLocale) {
      data.subtitleLocale = subtitleLocale;
    }

    if (password) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      data.password = password;
    }

    if (Object.keys(data).length === 0) {
      onClose(); // No changes
      return;
    }

    onUpdate(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#080D24]/95 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
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
              ACCOUNT PREFERENCES
            </span>
          </div>
          <h2 className="font-title-md text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Profile Settings
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2 font-label-md">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full appearance-none bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="e.g. CinemaLover99"
            />
          </div>

          {/* Subtitle Locale */}
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2 font-label-md">
              Preferred Subtitle Language
            </label>
            <div className="relative">
              <select
                value={subtitleLocale}
                onChange={(e) => setSubtitleLocale(e.target.value)}
                className="w-full appearance-none bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-2 border-t border-white/10 space-y-5">
            <div className="text-xs font-semibold text-white uppercase tracking-wider font-label-md">
              Change Password
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full appearance-none bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="New Password (leave blank to keep current)"
              />
            </div>
            {password.length > 0 && (
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full appearance-none bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Confirm New Password"
                />
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
