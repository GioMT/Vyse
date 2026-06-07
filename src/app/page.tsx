"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function AuthErrorNotification({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const error = searchParams.get('error');
    const desc = searchParams.get('error_description');
    if (error) {
      onError(desc ? decodeURIComponent(desc).replace(/\+/g, ' ') : error);
    }
  }, [searchParams, onError]);

  return null;
}
import { useFinanceStore } from '@/hooks/use-finance-store';
import { isDemoMode } from '@/lib/supabase';
import { 
  Shield, 
  Zap, 
  Briefcase, 
  CreditCard,
  LineChart,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Home() {
  const { login, loginWithEmail, signUpWithEmail, checkEmailExists, resendVerificationEmail, fetchUser, sendPasswordResetEmail } = useFinanceStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<'signin' | 'signup' | 'verify' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification state variables
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState<string[]>(Array(6).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [tempSignUpData, setTempSignUpData] = useState<{
    email: string;
    password: string;
    combinedName: string;
    dob: string;
    sex: string;
  } | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    fetchUser().then((currentUser) => {
      if (currentUser) {
        if (currentUser.onboarded === false) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    });
  }, [fetchUser, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await login();
      if (success) {
        const currentUser = await fetchUser();
        if (currentUser && currentUser.onboarded === false) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (e) {
      console.error('Login failed:', e);
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return; // Only allow digits
    const newCode = [...inputCode];
    newCode[index] = val.slice(-1); // Take only the last character entered
    setInputCode(newCode);
    
    // Auto focus next input if we typed a digit
    if (val && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setInputCode(newCode);
      document.getElementById('code-5')?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempSignUpData) {
      setError('Registration data missing. Please sign up again.');
      setAuthState('signup');
      return;
    }

    const typedCode = inputCode.join('').trim();
    if (typedCode.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    if (typedCode !== verificationCode) {
      setError('Invalid verification code. Please check and try again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { email, password, combinedName, dob, sex } = tempSignUpData;
      const res = await signUpWithEmail(email, password, combinedName, dob, sex);
      if (res.success) {
        router.push('/onboarding');
      } else {
        setError(res.error || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error('Verification signUp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendStatus(null);
    
    if (isDemoMode()) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setInputCode(Array(6).fill(''));
      setResendStatus('A new simulated code has been generated.');
      setResendCooldown(30);
    } else {
      const emailToResend = tempSignUpData?.email || email;
      if (!emailToResend) return;
      setLoading(true);
      const res = await resendVerificationEmail(emailToResend);
      setLoading(false);
      if (res.success) {
        setResendStatus('Verification email resent successfully.');
        setResendCooldown(30);
      } else {
        setError(res.error || 'Failed to resend verification email.');
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await sendPasswordResetEmail(email);
      if (res.success) {
        setResetEmailSent(true);
      } else {
        setError(res.error || 'Failed to send password reset request.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authState === 'signup') {
      if (!email || !password || !firstName || !lastName || !dob || !sex) {
        setError('Please fill out all fields.');
        return;
      }
      if (!agreeTerms) {
        setError('You must agree to the terms and conditions and privacy policy.');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please fill out all fields.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      if (authState === 'signin') {
        const res = await loginWithEmail(email, password);
        if (res.success) {
          const currentUser = await fetchUser();
          if (currentUser && currentUser.onboarded === false) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        } else {
          setError(res.error || 'Invalid credentials.');
        }
      } else {
        const demo = isDemoMode();
        const combinedName = `${firstName} ${lastName}`.trim();
        
        if (demo) {
          // Check if email already exists
          const exists = await checkEmailExists(email);
          if (exists) {
            setError('An account with this email already exists.');
            setLoading(false);
            return;
          }
          
          // Generate 6-digit code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setVerificationCode(code);
          setInputCode(Array(6).fill(''));
          setTempSignUpData({ email, password, combinedName, dob, sex });
          setAuthState('verify');
        } else {
          // Supabase mode: call signUpWithEmail directly
          const res = await signUpWithEmail(email, password, combinedName, dob, sex);
          if (res.success) {
            if (res.needsVerification) {
              setTempSignUpData({ email, password, combinedName, dob, sex });
              setAuthState('verify');
            } else {
              router.push('/onboarding');
            }
          } else {
            setError(res.error || 'Failed to create account.');
          }
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
      <Suspense fallback={null}>
        <AuthErrorNotification onError={setError} />
      </Suspense>
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
          <div className={`w-full max-w-md p-7 rounded-2xl bg-neutral-900 border border-neutral-850/80 backdrop-blur-xl shadow-2xl relative transition-all duration-300 ease-out ${authState === 'signup' ? 'lg:-translate-y-10' : ''}`}>
            {/* Top glass reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            
            <div className="flex flex-col gap-5">
              {authState === 'signin' && (
                <>
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
                      onClick={() => { setAuthState('signin'); setError(null); setResendStatus(null); setShowPassword(false); }}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthState('signup'); setError(null); setResendStatus(null); setShowPassword(false); }}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer text-neutral-550 hover:text-neutral-350"
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

                  {/* Sign In Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-3.5">
                    <div className="space-y-1.5 text-left">
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

                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-neutral-500">Password</label>
                        <button
                          type="button"
                          onClick={() => { setAuthState('forgot'); setError(null); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-5"
                    >
                      {loading ? (
                        <div className="h-5 w-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Sign In</span>
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
                </>
              )}

              {authState === 'forgot' && (
                <>
                  {/* Logo / Header */}
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-neutral-850 shadow-inner shrink-0 flex items-center justify-center">
                      <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" />
                    </div>
                    <h2 className="text-xl font-extrabold text-neutral-100 tracking-tight">Reset Password</h2>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {!resetEmailSent ? (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
                      <p className="text-xs text-neutral-500 leading-normal">
                        Enter your e-mail address and we will send you a secure link to reset your account password.
                      </p>
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

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading ? (
                          <div className="h-5 w-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setAuthState('signin'); setError(null); }}
                        className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-neutral-800 text-neutral-400 font-bold text-sm transition-all duration-200 flex items-center justify-center cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-4">
                      <div className="mx-auto h-12 w-12 rounded-full bg-indigo-950 border border-indigo-850 flex items-center justify-center text-indigo-400 animate-pulse">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-neutral-200">Reset Link Sent</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
                          {isDemoMode() ? (
                            <>
                              Simulated Reset: A password recovery session has been initialized. Normally, this sends a real link. Click below to simulate landing:
                              <button
                                type="button"
                                onClick={() => {
                                  router.push('/dashboard?recovery=true');
                                }}
                                className="block w-full mt-3 h-8.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Simulate Recovery Landing
                              </button>
                            </>
                          ) : (
                            `If an account exists for ${email}, a secure password reset link has been dispatched.`
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAuthState('signin'); setResetEmailSent(false); setError(null); }}
                        className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 text-xs font-bold text-neutral-400 cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  )}
                </>
              )}

              {authState === 'signup' && (
                <>
                  {/* Custom Onboarding Sign Up Layout */}
                  {/* Logo / Header */}
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-neutral-850 shadow-inner shrink-0 flex items-center justify-center">
                      <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" />
                    </div>
                    <h2 className="text-xl font-extrabold text-neutral-100 tracking-tight">Create a Vyse account</h2>
                  </div>

                  {/* Swappable Segment Control Tabs */}
                  <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
                    <button
                      type="button"
                      onClick={() => { setAuthState('signin'); setError(null); setResendStatus(null); setShowPassword(false); }}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer text-neutral-550 hover:text-neutral-350"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthState('signup'); setError(null); setResendStatus(null); setShowPassword(false); }}
                      className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm"
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

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {/* E-mail Input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-neutral-500">E-mail</label>
                      <input
                        type="email"
                        placeholder="Enter e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                      />
                    </div>

                    {/* First & Last Name Inputs inline */}
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500">First Name</label>
                        <input
                          type="text"
                          placeholder="Your first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Last Name</label>
                        <input
                          type="text"
                          placeholder="Your last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Date of Birth & Sex Inputs inline */}
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Date of Birth</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          required
                          style={{ colorScheme: 'dark' }}
                          className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-500">Sex</label>
                        <select
                          value={sex}
                          onChange={(e) => setSex(e.target.value)}
                          required
                          className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 transition-colors cursor-pointer"
                        >
                          <option value="" disabled className="bg-neutral-950 text-neutral-450">Select sex</option>
                          <option value="male" className="bg-neutral-950 text-neutral-100">Male</option>
                          <option value="female" className="bg-neutral-950 text-neutral-100">Female</option>
                        </select>
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-neutral-500">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-10.5 w-full pl-3.5 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className="flex items-start gap-2.5 pt-1 text-left">
                      <input
                        type="checkbox"
                        id="agree-terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-neutral-800 bg-neutral-950 accent-indigo-600 focus:ring-0 focus:outline-none shrink-0 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="agree-terms" className="text-xs text-neutral-450 select-none leading-normal">
                        By creating an account, you agree to the{' '}
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium">
                          terms and conditions
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium">
                          privacy policy
                        </a>{' '}
                        of Vyse.
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-4"
                    >
                      {loading ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Create an account</span>
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
                        <span>Google Secure Sign-up</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {authState === 'verify' && (
                <div className="flex flex-col gap-5 text-center">
                  {/* Header Icon / Title */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Key className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-neutral-100 tracking-tight">Verify your email</h2>
                      <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                        We&apos;ve sent a verification {isDemoMode() ? 'code' : 'link'} to <span className="text-indigo-400 font-semibold">{tempSignUpData?.email}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Status Notifications / Error display */}
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 text-left animate-in fade-in duration-200">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-bounce" />
                      <span>{error}</span>
                    </div>
                  )}

                  {resendStatus && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2 text-left animate-in fade-in duration-200">
                      <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{resendStatus}</span>
                    </div>
                  )}

                  {isDemoMode() ? (
                    /* Demo mode simulation */
                    <form onSubmit={handleVerifyCode} className="space-y-5">
                      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 text-xs text-left flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                          <Mail className="h-4 w-4" />
                          <span>Simulated Verification Box</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed">
                          Since you are running in **Demo Mode**, we&apos;ve simulated sending a code. Use the code below to complete registration:
                        </p>
                        <div className="flex items-center justify-between bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-850 mt-1 select-all">
                          <span className="font-mono text-xs text-neutral-500">CODE:</span>
                          <span className="font-mono text-base font-extrabold tracking-widest text-indigo-400">{verificationCode}</span>
                        </div>
                      </div>

                      {/* 6 Digit Inputs */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 block text-left">Enter 6-digit Verification Code</label>
                        <div className="flex justify-between gap-2">
                          {inputCode.map((digit, index) => (
                            <input
                              key={index}
                              id={`code-${index}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onPaste={handlePaste}
                              className="h-11 w-11 text-center rounded-xl bg-neutral-955 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-lg font-bold text-neutral-100 placeholder-neutral-800 transition-colors focus:ring-1 focus:ring-indigo-500/30"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Verify Code & Complete Sign Up</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Real Supabase verification link confirmation instructions */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/15 text-xs text-left space-y-2.5">
                        <p className="text-neutral-300 leading-relaxed font-medium">
                          We&apos;ve sent an activation link to your email address. Please click the link to activate your account.
                        </p>
                        <p className="text-neutral-500 leading-relaxed">
                          Once confirmed, you will be redirected to the dashboard. If your browser does not open automatically, you can sign in below.
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setAuthState('signin');
                          setError(null);
                          setResendStatus(null);
                        }}
                        className="w-full h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-950 font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] cursor-pointer"
                      >
                        Go to Sign In
                      </button>
                    </div>
                  )}

                  {/* Bottom controls: Resend & Go Back */}
                  <div className="flex flex-col gap-3.5 mt-2">
                    <button
                      onClick={handleResendCode}
                      disabled={loading || resendCooldown > 0}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer self-center"
                    >
                      {resendCooldown > 0 ? (
                        <span>Resend Code in {resendCooldown}s</span>
                      ) : (
                        <span>Resend Verification Email</span>
                      )}
                    </button>

                    <div className="h-[1px] bg-neutral-850 w-full" />

                    <button
                      onClick={() => {
                        setAuthState(isDemoMode() ? 'signup' : 'signin');
                        setError(null);
                        setResendStatus(null);
                        setShowPassword(false);
                      }}
                      className="text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-center"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to {isDemoMode() ? 'Sign Up' : 'Sign In'}</span>
                    </button>
                  </div>
                </div>
              )}
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
