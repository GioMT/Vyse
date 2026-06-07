"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { isDemoMode } from '@/lib/supabase';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

function generateVerificationCode(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const verifyPasswordSchema = z.object({
  password: z.string().min(1, { message: 'Password is required' }),
});

const verifyDeleteSchema = z.object({
  password: z.string().min(1, { message: 'Password is required' }),
});

const newEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Please enter a valid email address' }),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  dob: z.string().optional(),
  sex: z.string().optional(),
});

type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

interface AccountDetailsModalProps {
  onSuccess: () => void;
}

type Step = 'view' | 'edit-profile' | 'auth' | 'new-email' | 'verify-code' | 'delete-auth';

export default function AccountDetailsModal({ onSuccess }: AccountDetailsModalProps) {
  const { user, verifyCurrentPassword, updateUserEmail, updateProfile, deleteUserAccount } = useFinanceStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>('view');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Stored values during the wizard
  const [newEmailInput, setNewEmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState<string[]>(Array(6).fill(''));

  const nameParts = (user?.full_name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // 1. Password Verification Form Hook
  const {
    register: registerAuth,
    handleSubmit: handleSubmitAuth,
    formState: { errors: errorsAuth }
  } = useForm<{ password: string }>({
    resolver: zodResolver(verifyPasswordSchema)
  });

  // 2. New Email Form Hook
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail }
  } = useForm<{ newEmail: string }>({
    resolver: zodResolver(newEmailSchema),
    defaultValues: { newEmail: '' }
  });

  // 3. Profile update Form Hook
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: errorsProfile }
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema)
  });

  // 4. Delete Account Form Hook
  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    formState: { errors: errorsDelete }
  } = useForm<{ password: string }>({
    resolver: zodResolver(verifyDeleteSchema)
  });

  useEffect(() => {
    if (step === 'edit-profile') {
      const parts = (user?.full_name || '').trim().split(/\s+/);
      resetProfile({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        dob: user?.dob || '',
        sex: user?.sex || '',
      });
    }
  }, [step, user, resetProfile]);

  const handleStartEmailChange = () => {
    setError(null);
    setStep('auth');
  };

  const onProfileSubmit = async (values: UpdateProfileValues) => {
    setLoading(true);
    setError(null);
    try {
      const combinedFullName = `${values.firstName} ${values.lastName}`.trim();
      const res = await updateProfile(combinedFullName, values.dob || '', values.sex || '');
      if (res.success) {
        setStep('view');
      } else {
        setError(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during profile update.');
    } finally {
      setLoading(false);
    }
  };

  const formatSex = (sex?: string) => {
    if (!sex) return 'Not specified';
    return sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const onPasswordSubmit = async (values: { password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const isValid = await verifyCurrentPassword(values.password);
      if (isValid) {
        setStep('new-email');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const onDeleteSubmit = async (values: { password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const isValid = await verifyCurrentPassword(values.password);
      if (isValid) {
        const success = await deleteUserAccount();
        if (success) {
          onSuccess();
          router.push('/');
        } else {
          setError('Failed to delete user account.');
        }
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during account deletion.');
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (values: { newEmail: string }) => {
    if (values.newEmail.toLowerCase().trim() === user?.email.toLowerCase().trim()) {
      setError('New email must be different from current email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setNewEmailInput(values.newEmail);
      
      if (isDemoMode()) {
        // Generate a simulated 6-digit verification code
        const code = generateVerificationCode();
        setVerificationCode(code);
        setInputCode(Array(6).fill(''));
        setStep('verify-code');
      } else {
        // In Supabase mode, call updateUserEmail directly to trigger confirmation emails
        const success = await updateUserEmail(values.newEmail);
        if (success) {
          setStep('verify-code');
        } else {
          setError('Failed to initiate email change. The email may already be in use or is invalid.');
        }
      }
    } catch (err) {
      console.error(err);
      setError(isDemoMode() ? 'An error occurred while generating verification code.' : 'An error occurred while initiating email update.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...inputCode];
    newCode[index] = val.slice(-1);
    setInputCode(newCode);

    if (val && index < 5) {
      const nextInput = document.getElementById(`acc-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputCode[index] && index > 0) {
      const prevInput = document.getElementById(`acc-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDemoMode()) {
      // In Supabase mode, this is just a confirmation page, clicking the submit button closes the modal
      onSuccess();
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
      const success = await updateUserEmail(newEmailInput);
      if (success) {
        setStep('view');
        // Success callback
        onSuccess();
      } else {
        setError('Failed to update email address.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during email update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">
          Account Settings
        </DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          View your profile details and update your workspace registration.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: View profile details */}
      {step === 'view' && (
        <div className="space-y-4 py-3 text-left">
          <div className="space-y-4 p-4 rounded-xl bg-neutral-950/40 border border-neutral-850/50">
            {/* Name Fields (First and Last Name) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">First Name</span>
                <span className="text-sm font-bold text-neutral-200 truncate mt-0.5">{firstName || 'Personal'}</span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Last Name</span>
                <span className="text-sm font-bold text-neutral-200 truncate mt-0.5">{lastName || 'User'}</span>
              </div>
            </div>

            <div className="h-[1px] bg-neutral-850/50 w-full" />

            {/* DOB and Sex Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Date of Birth</span>
                <span className="text-sm font-bold text-neutral-200 truncate mt-0.5">{formatDate(user?.dob)}</span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Gender / Sex</span>
                <span className="text-sm font-bold text-neutral-200 truncate mt-0.5">{formatSex(user?.sex)}</span>
              </div>
            </div>

            <div className="h-[1px] bg-neutral-850/50 w-full" />

            {/* Email Field with Change Email Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">E-mail Address</span>
                <span className="text-sm font-bold text-neutral-200 truncate mt-0.5">{user?.email || 'demo@finance.io'}</span>
              </div>
              
              {!user?.is_oauth || user?.has_password ? (
                <button
                  type="button"
                  onClick={handleStartEmailChange}
                  className="h-8 px-3.5 rounded-lg border border-neutral-800 hover:bg-neutral-855 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Change
                </button>
              ) : (
                <span className="text-[11px] text-neutral-550 bg-neutral-900 border border-neutral-850 px-2 py-1 rounded font-semibold shrink-0 select-none">
                  Google Account
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3.5 pt-2">
            <DialogFooter className="flex sm:justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('edit-profile');
                }}
                className="flex-grow h-10 rounded-xl bg-indigo-600 hover:bg-indigo-550 border border-indigo-550 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onSuccess}
                className="flex-grow h-10 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </DialogFooter>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('delete-auth');
                }}
                className="text-[11px] text-rose-500 hover:text-rose-400 font-bold tracking-wide transition-colors cursor-pointer select-none hover:underline"
              >
                Delete User Account & Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP: Edit Profile Details */}
      {step === 'edit-profile' && (
        <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4 py-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="h-10 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-600 transition-colors"
                {...registerProfile('firstName')}
              />
              {errorsProfile.firstName && (
                <p className="text-[11px] text-rose-500 mt-1">{errorsProfile.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                className="h-10 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-600 transition-colors"
                {...registerProfile('lastName')}
              />
              {errorsProfile.lastName && (
                <p className="text-[11px] text-rose-500 mt-1">{errorsProfile.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Date of Birth</label>
            <input
              type="date"
              className="h-10 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-200 placeholder-neutral-600 transition-colors dark:[color-scheme:dark]"
              {...registerProfile('dob')}
            />
          </div>

          {/* Gender / Sex */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Gender / Sex</label>
            <select
              className="h-10 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-200 transition-colors cursor-pointer"
              {...registerProfile('sex')}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep('view')}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </DialogFooter>
        </form>
      )}

      {/* STEP 2: Authenticate (Current Password Check) */}
      {step === 'auth' && (
        <form onSubmit={handleSubmitAuth(onPasswordSubmit)} className="space-y-4 py-3 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-neutral-450 leading-relaxed">
            To change your e-mail address, please verify your identity by entering your current account password.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...registerAuth('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errorsAuth.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errorsAuth.password.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep('view')}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      )}

      {/* STEP 3: Enter New Email */}
      {step === 'new-email' && (
        <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4 py-3 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">New Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                placeholder="enter-new-email@example.com"
                className="h-10.5 w-full pl-9 pr-3.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...registerEmail('newEmail')}
              />
            </div>
            {errorsEmail.newEmail && (
              <p className="text-[11px] text-rose-500 mt-1">{errorsEmail.newEmail.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep('auth')}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Code</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      )}

      {/* STEP 4: Verification Code (Sent to old email) */}
      {step === 'verify-code' && (
        <form onSubmit={handleVerifyCodeSubmit} className="space-y-5 py-3 text-left">
          {isDemoMode() ? (
            <>
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Mail className="h-4 w-4" />
                  <span>Simulated Verification Box</span>
                </div>
                <p className="text-neutral-400 leading-relaxed font-normal">
                  We&apos;ve simulated sending a code to your old email address (<span className="text-neutral-200">{user?.email}</span>). Copy the code below to confirm updating to <span className="text-indigo-400">{newEmailInput}</span>:
                </p>
                <div className="flex items-center justify-between bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-850 mt-1 select-all">
                  <span className="font-mono text-xs text-neutral-500">CODE:</span>
                  <span className="font-mono text-base font-extrabold tracking-widest text-indigo-400">{verificationCode}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 block">Enter 6-digit Verification Code</label>
                <div className="flex justify-between gap-2">
                  {inputCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`acc-code-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-11 w-11 text-center rounded-xl bg-neutral-955 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-lg font-bold text-neutral-100 placeholder-neutral-800 transition-colors focus:ring-1 focus:ring-indigo-500/30"
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/15 text-xs text-left space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Mail className="h-4.5 w-4.5" />
                <span>Verification Emails Sent</span>
              </div>
              <p className="text-neutral-300 leading-relaxed font-medium">
                We have initiated the email change request to <span className="text-indigo-400 font-semibold">{newEmailInput}</span>.
              </p>
              <p className="text-neutral-500 leading-relaxed">
                Supabase requires verification of the email change. Please check both your **old** email inbox (<span className="text-neutral-350">{user?.email}</span>) and your **new** email inbox for confirmation links. Once both links are clicked, the email update will be complete.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            {isDemoMode() && (
              <button
                type="button"
                onClick={() => setStep('new-email')}
                disabled={loading}
                className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isDemoMode() ? 'Verify & Update' : 'Got it, Close'}</span>
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      )}

      {/* STEP: Delete Account Authentication & Confirmation */}
      {step === 'delete-auth' && (
        <form onSubmit={handleSubmitDelete(onDeleteSubmit)} className="space-y-4 py-3 text-left">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-450 leading-relaxed space-y-1.5 animate-in fade-in duration-200">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="h-4.5 w-4.5" />
              <span>Warning: Permanent Action</span>
            </div>
            <p className="font-normal text-[11px] leading-normal text-rose-350">
              Closing your account is permanent and cannot be undone. All your financial assets, transactions, bills, and settings will be permanently erased.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Confirm with Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password to confirm"
                className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-955 border border-neutral-850 focus:border-rose-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...registerDelete('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errorsDelete.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errorsDelete.password.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep('view')}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-850 hover:bg-neutral-800 text-neutral-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Permanently Delete Account</span>
              )}
            </button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
