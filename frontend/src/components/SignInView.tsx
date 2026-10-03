import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface SignInViewProps {
  onSuccess: (user: User) => void;
  onGoToSignUp: () => void;
  onGoToLanding: () => void;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSuccess,
  onGoToSignUp,
  onGoToLanding
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden font-sans select-none">
      {/* Cinematic Ambient Glow Blooms */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-electric-blue/15 blur-[150px] pointer-events-none animate-float-slow" />
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-violet/20 blur-[160px] pointer-events-none animate-float-slower" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink/10 blur-[180px] pointer-events-none animate-float-slow" />

      {/* Back to Landing link */}
      <button
        onClick={onGoToLanding}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-label-md uppercase tracking-wider text-on-surface-variant hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Back to Home</span>
      </button>

      {/* Midnight Blue Glass Authentication Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#080D24]/85 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-on-surface animate-fade-in-up delay-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-blue via-violet to-pink flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.5)] mb-2">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
          <h2 className="font-display-hero text-2xl sm:text-3xl text-white font-bold tracking-tight">
            Welcome Back
          </h2>
          <p className="font-body-md text-xs text-on-surface-variant max-w-xs">
            Sign in to enter your synchronized cinema spaces and AI watch telemetry.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-error/10 border border-error/30 text-xs text-error text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1 font-label-md">
              Email Address
            </label>
            <input
              type="email"
              required
              data-testid="login-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-muted-text focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-label-md">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              data-testid="login-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0D1535] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-muted-text focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full btn-primary-gradient py-3.5 rounded-xl font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="animate-spin text-sm">↻</span>
              ) : (
                <span className="group-hover:scale-105 transition-transform">SIGN IN</span>
              )}
            </button>
          </div>

          <div className="text-center pt-3 text-xs text-on-surface-variant">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onGoToSignUp}
              className="text-pink hover:underline font-semibold"
            >
              Sign up now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
