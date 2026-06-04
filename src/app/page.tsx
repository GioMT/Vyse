"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { isDemoMode } from '@/lib/supabase';
import { 
  Shield, 
  Zap, 
  Briefcase, 
  CreditCard,
  LineChart,
  HelpCircle,
  Mail,
  Lock,
  User,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const { login, loginWithEmail, signUpWithEmail, fetchUser } = useFinanceStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const demoMode = isDemoMode();

  useEffect(() => {
    // Check if user is already authenticated
    fetchUser().then((currentUser) => {
      if (currentUser) {
        router.push('/dashboard');
      }
    });
  }, [fetchUser, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await login();
      if (success) {
        router.push('/dashboard');
      }
    } catch (e) {
      console.error('Login failed:', e);
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activeTab === 'signup' && !fullName)) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'signin') {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          router.push('/dashboard');
        } else {
          setError(res.error || 'Invalid credentials.');
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.success) {
          router.push('/dashboard');
        } else {
          setError(res.error || 'Failed to create account.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/35 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-200/30 blur-[130px] pointer-events-none" />
      
      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10 shrink-0 flex items-center justify-center">
            <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" priority />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            VYSE<span className="text-indigo-400 font-medium">.</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-neutral-900 border border-neutral-850 text-neutral-500 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${demoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {demoMode ? 'Local Preview Mode' : 'Cloud Database Mode'}
          </span>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        {/* Left Side: Product Copy */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
          <div className="inline-flex self-center lg:self-start items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-medium">
            <Zap className="h-3.5 w-3.5" />
            <span>Next-Generation Wealth Management</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Master your money. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Elevate your assets.
            </span>
          </h1>
          <p className="text-neutral-500 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Vyse — Your financial Advyser and tracker. A premium, multi-tenant financial platform designed to track your cash flow, automate recurring bills, monitor loans, and visualize your wealth in real-time.
          </p>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto lg:mx-0">
            <div className="flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                <Briefcase className="h-4.5 w-4.5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-100">Real-time Ledger</h3>
                <p className="text-xs text-neutral-500">Track and categorize transactions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-100">Automated Bills</h3>
                <p className="text-xs text-neutral-500">Track recurring costs easily.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                <LineChart className="h-4.5 w-4.5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-100">Rich Charts</h3>
                <p className="text-xs text-neutral-500">Visualize income & expense ratios.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0">
                <Shield className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-100">RLS Safeguards</h3>
                <p className="text-xs text-neutral-500">Strict PostgreSQL tenant isolation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Panel */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-md p-7 rounded-2xl bg-neutral-900 border border-neutral-850/80 backdrop-blur-xl shadow-2xl relative">
            {/* Top glass reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            
            <div className="flex flex-col gap-5">
              {/* Logo / Header */}
              <div className="flex items-center gap-2.5 justify-center">
                <div className="h-10 w-10 rounded-xl overflow-hidden border border-neutral-850 shadow-inner shrink-0 flex items-center justify-center">
                  <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" />
                </div>
                <h2 className="text-xl font-extrabold text-neutral-100 tracking-tight">Enter Vyse Portal</h2>
              </div>

              {/* Swappable Segment Control Tabs */}
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm'
                      : 'text-neutral-550 hover:text-neutral-350'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm'
                      : 'text-neutral-550 hover:text-neutral-350'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Status Notifications / Error display */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {demoMode && activeTab === 'signin' && !email && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-left text-[11px] text-amber-300/85 flex items-start gap-2.5">
                  <HelpCircle className="h-4.5 w-4.5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Local Workspace Active:</span> You can sign in using `demo@finance.io` and `password`, or create a custom account!
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {activeTab === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-10.5 w-full pl-9 pr-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10.5 w-full pl-9 pr-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10.5 w-full pl-9 pr-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-5"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </form>

              {/* OR Continue With Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-[1px] bg-neutral-850" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Or continue with</span>
                <div className="flex-1 h-[1px] bg-neutral-850" />
              </div>

              {/* Google OAuth Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-800 text-neutral-100 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.3-4.53 0-6.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Google Secure Sign-in</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 justify-center text-[10px] text-neutral-500">
                <Shield className="h-3.5 w-3.5 text-neutral-600" />
                <span>Protected by PostgreSQL Row Level Security (RLS)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 flex flex-col gap-1.5 items-center justify-center">
        <p>© 2026 Vyse. All rights reserved.</p>
        <p className="text-[10px] text-neutral-600">A product of Valk Horizon Ventures</p>
      </footer>
    </div>
  );
}
