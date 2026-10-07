'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingApproval(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail && data.detail.includes('waiting for Super Admin approval')) {
          setIsPendingApproval(true);
        }
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      // Save user session
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      const userRole = data.user?.role;
      if (userRole === 'Super Admin' || userRole === 'Administrator') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex items-center justify-center lg:justify-end lg:pr-16 xl:pr-32 p-4 sm:p-6 bg-slate-50">
      {/* Full-viewport Light Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-left-center bg-slate-50"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      />

      {/* Subtle overlay for mobile/tablet contrast */}
      <div className="absolute inset-0 bg-slate-900/10 lg:hidden pointer-events-none" />

      {/* Cover Gemini sparkle icon in bottom-right corner if present */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-12 h-12 bg-white/90 rounded-full blur-xs pointer-events-none z-10" />

      {/* Glassmorphic Auth Card for Light Theme */}
      <div className="relative z-20 w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-slate-900/10 glass-card-animate text-gray-900">
        <div className="mb-6 text-left">
          <h1 className="text-3xl font-bold text-[#1E3A5F] tracking-tight">Welcome Back</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to access your EmotionalVaccine portal</p>
        </div>

        {/* Pending Approval Banner */}
        {isPendingApproval && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-3 items-start shadow-2xs">
            <span className="text-lg shrink-0">⏳</span>
            <div>
              <div className="font-semibold text-amber-900">Account Approval Pending</div>
              <div className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                Your account is waiting for Super Admin approval. Please check back after an administrator has reviewed and approved your role.
              </div>
            </div>
          </div>
        )}

        {/* Standard Error Banner */}
        {error && !isPendingApproval && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm shadow-2xs">
            <strong className="font-semibold">Error: </strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-gray-700 text-sm font-semibold mb-1.5 block">
              Username or Email Address
            </label>
            <input
              id="username"
              type="text"
              required
              className="glass-input-light bg-white border border-gray-300/80 text-gray-900 placeholder:text-gray-400 rounded-lg h-11 px-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0D6E5B] focus:border-[#0D6E5B] transition-all shadow-2xs"
              placeholder="e.g. admin or your@email.com"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-gray-700 text-sm font-semibold mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="glass-input-light bg-white border border-gray-300/80 text-gray-900 placeholder:text-gray-400 rounded-lg h-11 pl-4 pr-11 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0D6E5B] focus:border-[#0D6E5B] transition-all shadow-2xs"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye Off Icon */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                  </svg>
                ) : (
                  /* Eye Icon */
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#0D6E5B] to-emerald-600 hover:from-[#0B5B4B] hover:to-emerald-700 text-white font-semibold rounded-lg h-11 w-full hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-gray-600 text-sm mt-6 text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#0D6E5B] hover:text-[#0B5B4B] font-semibold hover:underline transition-colors">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}