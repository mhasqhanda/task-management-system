'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (emailToUse: string, passwordToUse: string) => {
    setEmail(emailToUse);
    setPassword(passwordToUse);
    setError('');
    setLoading(true);
    try {
      await login(emailToUse, passwordToUse);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh bg-[#0a0a0f] flex items-center justify-center px-4 py-6 sm:p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 sm:w-96 h-60 sm:h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-60 sm:w-96 h-60 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 my-4 sm:my-8">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-3 sm:mb-4 shadow-lg shadow-violet-500/25">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">TaskFlow</h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">Enterprise Task Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-5 sm:mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo quick-login */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center mb-4 uppercase tracking-wider font-medium">Quick Demo Login</p>
            
            <div className="space-y-4">
              {/* Core Roles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('pm@demo.com', 'Password123!')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center text-center py-2 px-3 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all text-xs font-medium disabled:opacity-50"
                >
                  <span className="font-bold">Product Manager</span>
                  <span className="opacity-70 text-[10px] mt-0.5 text-violet-200">Full Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('client@demo.com', 'Password123!')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center text-center py-2 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all text-xs font-medium disabled:opacity-50"
                >
                  <span className="font-bold">Client Guest</span>
                  <span className="opacity-70 text-[10px] mt-0.5 text-emerald-200">Portal View</span>
                </button>
              </div>

              {/* Internal Team */}
              <div>
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-semibold text-center">Internal Team Members</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Alex Kumar', dept: 'Frontend', email: 'dev@demo.com' },
                    { name: 'Maya Torres', dept: 'UI/UX', email: 'designer@demo.com' },
                    { name: 'James Park', dept: 'Backend', email: 'backend@demo.com' },
                    { name: 'Priya Sharma', dept: 'QA', email: 'qa@demo.com' },
                    { name: 'Carlos Ruiz', dept: 'DevOps', email: 'devops@demo.com' },
                  ].map((u) => (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => quickLogin(u.email, 'Password123!')}
                      disabled={loading}
                      className="flex flex-col items-start text-left py-2 px-3 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-[11px] disabled:opacity-50"
                    >
                      <span className="font-semibold text-slate-200">{u.name}</span>
                      <span className="opacity-80 mt-0.5 text-blue-400">{u.dept}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Password for all demo accounts: <span className="text-slate-400 font-mono">Password123!</span>
        </p>
      </div>
    </main>
  );
}
