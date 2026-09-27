import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'HOST'>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(email, displayName, password, role);
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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
              AUTHENTICATION
            </span>
          </div>
          <h2 className="font-title-md text-2xl text-white font-bold tracking-tight">
            {isRegister ? 'Create Account' : 'Sign In to Watch Spaces'}
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            {isRegister
              ? 'Join the high-fidelity social streaming ecosystem with personalized timeline feeds.'
              : 'Enter your credentials to access your synchronized rooms and AI watch telemetry.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-xs text-pink-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
                Initial Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('VIEWER')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                    role === 'VIEWER'
                      ? 'bg-gradient-to-r from-blue-600/30 to-violet-600/30 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'bg-[#0D1535] border-white/10 text-on-surface-variant'
                  }`}
                >
                  Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('HOST')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                    role === 'HOST'
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-pink-400 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                      : 'bg-[#0D1535] border-white/10 text-on-surface-variant'
                  }`}
                >
                  Room Host
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin text-sm">↻</span>
              ) : (
                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
              )}
            </button>
          </div>

          <div className="text-center pt-2 text-xs text-on-surface-variant">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-pink-300 hover:text-white font-semibold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to Watch Spaces?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-pink-300 hover:text-white font-semibold"
                >
                  Create an Account
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
