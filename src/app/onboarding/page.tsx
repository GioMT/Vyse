"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { 
  Zap, 
  User, 
  Mail, 
  Calendar, 
  Plus, 
  Wallet, 
  Check, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AccountForm from '@/components/dashboard/account-form';
import { ATMCard, PaperBill } from '@/app/dashboard/accounts/page';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  colorClass: string;
  barColorClass: string;
} {
  if (!password) {
    return { score: 0, label: 'Empty', colorClass: 'text-neutral-500', barColorClass: 'bg-neutral-800' };
  }
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 6) {
    score = Math.min(score, 1);
  }

  switch (score) {
    case 0:
    case 1:
      return { score: 1, label: 'Weak', colorClass: 'text-rose-500', barColorClass: 'bg-rose-500' };
    case 2:
    case 3:
      return { score: 2, label: 'Moderate', colorClass: 'text-amber-500', barColorClass: 'bg-amber-500' };
    case 4:
    default:
      return { score: 3, label: 'Strong', colorClass: 'text-emerald-400', barColorClass: 'bg-emerald-500' };
  }
}

export default function OnboardingPage() {
  const { user, accounts, fetchUser, updateProfile } = useFinanceStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Phase 1 form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dialog state for Account Form
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  useEffect(() => {
    fetchUser().then((currentUser) => {
      if (!currentUser) {
        router.push('/');
      } else if (currentUser.onboarded === true) {
        router.push('/dashboard');
      } else {
        // Pre-populate fields from signup
        const nameParts = (currentUser.full_name || '').split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        setDob(currentUser.dob || '');
        setSex(currentUser.sex || '');
        setEmail(currentUser.email || '');
        setCurrency(currentUser.currency || 'PHP');
        setLoading(false);
      }
    });
  }, [fetchUser, router]);

  const handlePhase1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !sex || !currency) {
      setError('All fields are required.');
      return;
    }

    if (user?.is_oauth) {
      if (!password || !confirmPassword) {
        setError('Please set up a password for manual login.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const combinedName = `${firstName} ${lastName}`.trim();
      const res = await updateProfile(combinedName, dob, sex, false, currency, user?.is_oauth ? password : undefined);
      if (res.success) {
        setStep(2);
      } else {
        setError(res.error || 'Failed to update details.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (accounts.length === 0) {
      setError('Please link at least one financial account to complete onboarding.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleOnboardingFinalize = async (startTour: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const combinedName = `${firstName} ${lastName}`.trim();
      const res = await updateProfile(combinedName, dob, sex, true, currency);
      if (res.success) {
        if (startTour) {
          localStorage.setItem('vyse_tour_active', 'true');
          localStorage.setItem('vyse_initial_tour', 'true');
          router.push('/dashboard?tour=true');
        } else {
          localStorage.removeItem('vyse_tour_active');
          localStorage.removeItem('vyse_initial_tour');
          router.push('/dashboard');
        }
      } else {
        setError(res.error || 'Failed to complete onboarding.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during onboarding completion.');
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  if (loading && step === 1) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 font-sans">
        <div className="relative flex flex-col items-center gap-4">
          <div className="absolute h-24 w-24 rounded-full bg-indigo-200/30 blur-xl animate-pulse" />
          <div className="h-14 w-14 rounded-2xl overflow-hidden animate-bounce shadow-xl flex items-center justify-center">
            <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={58} height={58} className="h-[58px] w-[58px] min-w-[58px] object-cover" priority />
          </div>
          <span className="text-neutral-500 text-sm font-medium tracking-wide animate-pulse">
            Loading onboarding session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Background Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-200/20 blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10 shrink-0 flex items-center justify-center">
            <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            VYSE<span className="text-indigo-400 font-medium">.</span>
          </span>
        </div>
        <div className="text-xs text-neutral-500 font-semibold tracking-wider uppercase bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg">
          Step {step} of 3
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-12 w-full max-w-4xl mx-auto">
        
        {/* Step Stepper Header */}
        <div className="flex items-center gap-2 mb-8 w-full max-w-lg">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              step >= 1 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className={`text-xs font-bold transition-colors ${step >= 1 ? 'text-neutral-200' : 'text-neutral-500'}`}>Review Details</span>
          </div>
          <div className="h-[1px] bg-neutral-850 flex-grow min-w-[8px]" />
          <div className="flex items-center gap-2 shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              step >= 2 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className={`text-xs font-bold transition-colors ${step >= 2 ? 'text-neutral-200' : 'text-neutral-500'}`}>Link Accounts</span>
          </div>
          <div className="h-[1px] bg-neutral-850 flex-grow min-w-[8px]" />
          <div className="flex items-center gap-2 shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              step === 3 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
            }`}>
              3
            </div>
            <span className={`text-xs font-bold transition-colors ${step === 3 ? 'text-neutral-200' : 'text-neutral-500'}`}>Product Tour</span>
          </div>
        </div>

        {/* Phase 1 Layout */}
        {step === 1 && (
          <div className="w-full max-w-md p-7 rounded-2xl bg-neutral-900 border border-neutral-850/80 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-extrabold text-neutral-100 tracking-tight flex items-center gap-2 justify-center">
                  <Zap className="h-5 w-5 text-indigo-400" />
                  <span>Review Profile Details</span>
                </h2>
                <p className="text-xs text-neutral-500">Please verify and update your signup information below.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePhase1Submit} className="space-y-4">
                {/* Email (Disabled) */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-neutral-500">E-mail Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-550" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="h-10.5 w-full pl-9.5 pr-3.5 rounded-xl bg-neutral-950/60 border border-neutral-850 text-sm text-neutral-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Names inline */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">First Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-555" />
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="h-10.5 w-full pl-9.5 pr-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Last Name *</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                    />
                  </div>
                </div>

                {/* DOB & Sex inline */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Date of Birth *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-555" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                        style={{ colorScheme: 'dark' }}
                        className="h-10.5 w-full pl-9.5 pr-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Sex *</label>
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

                {/* Default Currency Selector */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-neutral-500">Default Currency *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                    className="h-10.5 w-full px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 transition-colors cursor-pointer"
                  >
                    <option value="PHP" className="bg-neutral-950 text-neutral-100">Philippine Peso (PHP - ₱)</option>
                    <option value="USD" className="bg-neutral-950 text-neutral-100">US Dollar (USD - $)</option>
                    <option value="EUR" className="bg-neutral-950 text-neutral-100">Euro (EUR - €)</option>
                    <option value="GBP" className="bg-neutral-950 text-neutral-100">British Pound (GBP - £)</option>
                    <option value="JPY" className="bg-neutral-950 text-neutral-100">Japanese Yen (JPY - ¥)</option>
                    <option value="AUD" className="bg-neutral-950 text-neutral-100">Australian Dollar (AUD - A$)</option>
                    <option value="CAD" className="bg-neutral-950 text-neutral-100">Canadian Dollar (CAD - C$)</option>
                    <option value="SGD" className="bg-neutral-950 text-neutral-100">Singapore Dollar (SGD - S$)</option>
                  </select>
                </div>

                {/* Password Setup for OAuth users */}
                {user?.is_oauth && (
                  <div className="space-y-4 p-4 rounded-xl bg-neutral-955 border border-neutral-850/60 animate-in fade-in duration-200">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Set Up Account Password</span>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Create a password to enable manual login using your email address ({email}).
                      </p>
                    </div>

                    <div className="space-y-4 text-left">
                      {/* Password input (Row 1) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-neutral-500">Password *</label>
                          {password && (
                            <span className={`text-[10px] font-bold ${strength.colorClass} animate-in fade-in duration-150`}>
                              {strength.label}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10.5 w-full px-3.5 pr-12 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-neutral-350 font-bold tracking-wide transition-colors uppercase select-none cursor-pointer"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {password && (
                          <div className="grid grid-cols-3 gap-1 h-1.5 mt-1.5 animate-in fade-in duration-200">
                            <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.barColorClass : 'bg-neutral-800'}`} />
                            <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.barColorClass : 'bg-neutral-800'}`} />
                            <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.barColorClass : 'bg-neutral-800'}`} />
                          </div>
                        )}
                      </div>

                      {/* Confirm Password input (Row 2) */}
                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-semibold text-neutral-500 block">Confirm Password *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-10.5 w-full px-3.5 pr-12 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-neutral-350 font-bold tracking-wide transition-colors uppercase select-none cursor-pointer"
                          >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {confirmPassword && (
                          <div className="flex items-center gap-1.5 pt-0.5 text-[10px] animate-in fade-in duration-200">
                            {password === confirmPassword ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                <span className="text-emerald-400 font-medium">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="text-rose-450 font-medium">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center shadow-lg active:scale-[0.98] cursor-pointer mt-5"
                >
                  Continue to Accounts
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Phase 2 Layout */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            
            {/* Header info */}
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-extrabold text-neutral-100 tracking-tight flex items-center gap-2 justify-center">
                <Wallet className="h-6 w-6 text-indigo-400" />
                <span>Link Financial Accounts</span>
              </h2>
              <p className="text-xs text-neutral-500">
                To build your financial balance sheets, please link checking, savings, credit cards, or cash on hand.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200 max-w-md mx-auto">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Linked accounts display area */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-850 p-6 w-full shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-300">Your Portfolio Assets</h3>
                  <p className="text-[10px] text-neutral-550 mt-0.5">Linked accounts currently configuring in real-time</p>
                </div>

                <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                  <DialogTrigger
                    render={
                      <button className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        <span>Link Account</span>
                      </button>
                    }
                  />
                  <AccountForm onSuccess={() => setAccountDialogOpen(false)} />
                </Dialog>
              </div>

              {accounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((acc) => {
                    if (acc.type === 'cash') {
                      return (
                        <PaperBill
                          key={acc.id}
                          id={acc.id}
                          name={acc.name}
                          balance={acc.balance}
                          onEdit={() => {}}
                        />
                      );
                    } else {
                      return (
                        <ATMCard
                          key={acc.id}
                          id={acc.id}
                          name={acc.name}
                          type={acc.type}
                          balance={acc.balance}
                          color={acc.color}
                          userName={`${firstName} ${lastName}`.trim()}
                          accountNumber={acc.account_number}
                          onEdit={() => {}}
                        />
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-neutral-500 flex flex-col gap-2.5 items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-neutral-950 border border-neutral-850 flex items-center justify-center text-neutral-600 animate-pulse">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-300 text-sm">No linked accounts yet</h4>
                    <p className="text-xs text-neutral-500">Link your first checking or savings account above to begin tracking.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions toolbar */}
            <div className="flex justify-between items-center max-w-4xl w-full border-t border-neutral-900 pt-6">
              <button
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded-xl border border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Details
              </button>

              <button
                onClick={handleCompleteOnboarding}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-550 hover:to-emerald-450 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Tour
              </button>
            </div>
          </div>
        )}

        {/* Phase 3 Layout */}
        {step === 3 && (
          <div className="w-full max-w-lg p-8 rounded-2xl bg-neutral-900 border border-neutral-850/80 backdrop-blur-xl shadow-2xl relative animate-in fade-in duration-300 text-center">
            {/* Top decorative gradient line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            
            {/* Glowing orb background */}
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

            <div className="space-y-6">
              {/* Icon */}
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                <Zap className="h-8 w-8 text-indigo-100" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-100">
                  Welcome to Vyse!
                </h2>
                <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                  Your profile is verified and your financial portfolio is connected. You&apos;re ready to take control of your wealth.
                </p>
              </div>

              {/* Tour features preview */}
              <div className="p-4 rounded-xl bg-neutral-950/45 border border-neutral-850 text-left space-y-3 max-w-md mx-auto">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200">Portfolio Metrics</h4>
                    <p className="text-[10px] text-neutral-500">Track net worth, income streams, and current cash flow.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200">Interactive Analytics</h4>
                    <p className="text-[10px] text-neutral-500">Analyze category spending and monthly trends dynamically.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-200">Debt & Bills Tracker</h4>
                    <p className="text-[10px] text-neutral-500">Keep on top of active loans and recurring subscriptions.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => handleOnboardingFinalize(true)}
                  disabled={loading}
                  className="w-full sm:w-80 px-6 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
                >
                  <span>Start Tour</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="text-xs text-neutral-500 hover:text-neutral-300 font-semibold transition-colors cursor-pointer"
                >
                  Back to Accounts
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-neutral-900 py-6 text-center text-xs text-neutral-500 flex flex-col gap-1.5 items-center justify-center">
        <p>© 2026 Vyse. All rights reserved.</p>
        <p className="text-[10px] text-neutral-600">A product of Valk Horizon Ventures</p>
      </footer>
    </div>
  );
}
