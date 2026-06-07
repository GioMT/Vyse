"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Key, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';

function generateVerificationCode(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      return { score: 2, label: 'Fair', colorClass: 'text-amber-500', barColorClass: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Good', colorClass: 'text-indigo-400', barColorClass: 'bg-indigo-500' };
    case 4:
    default:
      return { score: 4, label: 'Strong', colorClass: 'text-emerald-400', barColorClass: 'bg-emerald-500' };
  }
}

const passwordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters' }),
  confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New password and confirm password do not match',
  path: ['confirmPassword']
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordChangeModalProps {
  onSuccess: () => void;
}

type Step = 'input' | 'verify-code';

export default function PasswordChangeModal({ onSuccess }: PasswordChangeModalProps) {
  const { user, verifyCurrentPassword, updateUserPassword } = useFinanceStore();
  const [step, setStep] = useState<Step>('input');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Show/hide password toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Stored values during step transition
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState<string[]>(Array(6).fill(''));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const newPasswordVal = watch('newPassword') || '';
  const confirmPasswordVal = watch('confirmPassword') || '';
  const strength = getPasswordStrength(newPasswordVal);

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    if (values.oldPassword === values.newPassword) {
      setError('New password must be different from current password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isValid = await verifyCurrentPassword(values.oldPassword);
      if (isValid) {
        setNewPasswordInput(values.newPassword);
        
        // Generate simulated verification code
        const code = generateVerificationCode();
        setVerificationCode(code);
        setInputCode(Array(6).fill(''));
        
        setStep('verify-code');
      } else {
        setError('Incorrect current password. Please check and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while verifying details.');
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
      const nextInput = document.getElementById(`pwd-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inputCode[index] && index > 0) {
      const prevInput = document.getElementById(`pwd-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const success = await updateUserPassword(newPasswordInput);
      if (success) {
        reset();
        onSuccess();
      } else {
        setError('Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100 flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-400" />
          <span>Change Password</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Ensure your account stays secure by choosing a strong password.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Enter password fields */}
      {step === 'input' && (
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 py-3 text-left">
          
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-550" />
              <input
                type={showOld ? "text" : "password"}
                placeholder="Enter current password"
                className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...register('oldPassword')}
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showOld ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.oldPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-555" />
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min. 6 chars)"
                className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showNew ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {newPasswordVal && (
              <div className="space-y-1 pt-0.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-neutral-450">Strength:</span>
                  <span className={`font-bold ${strength.colorClass}`}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.barColorClass : 'bg-neutral-800'}`} />
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.barColorClass : 'bg-neutral-800'}`} />
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.barColorClass : 'bg-neutral-800'}`} />
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.barColorClass : 'bg-neutral-800'}`} />
                </div>
              </div>
            )}
            {errors.newPassword && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-555" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                className="h-10.5 w-full pl-9 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-sm text-neutral-100 placeholder-neutral-500 transition-colors"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
              >
                {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {confirmPasswordVal && (
              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] animate-in fade-in duration-200">
                {newPasswordVal === confirmPasswordVal ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-emerald-455 font-medium">Passwords match</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-rose-450 font-medium">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={onSuccess}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-450 cursor-pointer"
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
                  <span>Update Password</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      )}

      {/* STEP 2: Verification Code Input */}
      {step === 'verify-code' && (
        <form onSubmit={handleVerifyCodeSubmit} className="space-y-5 py-3 text-left">
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Mail className="h-4 w-4" />
              <span>Simulated Verification Box</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              We&apos;ve simulated sending a code to your registered email (<span className="text-neutral-200">{user?.email}</span>). Enter the code below to finalize saving your new password:
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
                  id={`pwd-code-${index}`}
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

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep('input')}
              disabled={loading}
              className="h-10 px-4 text-xs font-bold rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 cursor-pointer"
            >
              Back
            </button>
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
                  <span>Verify & Update</span>
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
