import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface SignUpViewProps {
  onSuccess: (user: User) => void;
  onGoToSignIn: () => void;
  onGoToLanding: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  onSuccess,
  onGoToSignIn,
  onGoToLanding
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'HOST'>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register(email.trim(), displayName.trim(), password, role);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden font-sans select-none">
      {/* Cinematic Ambient Glow Blooms */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-electric-blue/15 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-violet/20 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink/10 blur-[180px] pointer-events-none" />

      {/* Back to Landing link */}
      <button
        onClick={onGoToLanding}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-label-md uppercase tracking-wider text-on-surface-variant hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Back to Home</span>
      </button>

      {/* Midnight Blue Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#080D24]/85 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-on-surface">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-blue via-violet to-pink flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.5)] mb-2">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <h2 className="font-display-hero text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Create Your Account
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant max-w-xs">
            Join the synchronized social cinema network with grounded AI Co-Pilot insights.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-error/10 border border-error/30 text-xs text-error text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Full Name / Alias
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-text focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-text focus:outline-none focus:border-electric-blue transition-colors"
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
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-text focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('VIEWER')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                  role === 'VIEWER'
                    ? 'bg-secondary/20 border-secondary text-secondary'
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
                    ? 'bg-gradient-to-r from-electric-blue/30 to-violet/30 border-electric-blue text-white'
                    : 'bg-[#0D1535] border-white/10 text-on-surface-variant'
                }`}
              >
                Room Host
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gradient py-3.5 rounded-xl font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(236,72,153,0.65)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin text-sm">↻</span>
              ) : (
                <span>GET STARTED</span>
              )}
            </button>
          </div>

          <div className="text-center pt-2 text-xs text-on-surface-variant">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onGoToSignIn}
              className="text-pink hover:underline font-semibold"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
