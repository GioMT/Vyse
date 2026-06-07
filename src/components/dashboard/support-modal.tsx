"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { HelpCircle, MessageSquare, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const supportSchema = z.object({
  type: z.enum(['feedback', 'problem']),
  subject: z.string().min(1, { message: 'Subject is required' }),
  description: z.string().min(1, { message: 'Please describe your request in detail' }),
});

type SupportFormValues = z.infer<typeof supportSchema>;

interface SupportModalProps {
  onSuccess: () => void;
}

export default function SupportModal({ onSuccess }: SupportModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      type: 'feedback',
      subject: '',
      description: ''
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (values: SupportFormValues) => {
    setLoading(true);
    try {
      console.log('Submitting support request:', values);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitted(false);
    onSuccess();
  };

  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      {!submitted ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
              <span>Support Portal</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Submit feedback, suggest ideas, or report technical difficulties.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3 text-left">
            {/* Support Type Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Request Type</label>
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
                <button
                  type="button"
                  onClick={() => setValue('type', 'feedback')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedType === 'feedback'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-550 hover:text-neutral-350'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Submit Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'problem')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedType === 'problem'
                      ? 'bg-rose-650/80 text-white shadow-sm border border-rose-500/10'
                      : 'text-neutral-555 hover:text-neutral-350'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Report a Problem</span>
                </button>
              </div>
              <input type="hidden" {...register('type')} />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Subject</label>
              <Input
                type="text"
                placeholder={selectedType === 'feedback' ? "e.g., Feature request: Crypto tracking" : "e.g., Transaction table scroll error"}
                className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.subject.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">Details / Description</label>
              <textarea
                placeholder={selectedType === 'feedback' ? "Provide your feedback or suggestions here..." : "Please describe the problem and steps to reproduce..."}
                className="w-full h-28 px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-500 focus:border-indigo-500 focus:outline-none transition-colors"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
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
                    <span>Submit</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </>
      ) : (
        <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-250">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-950 border border-emerald-850 flex items-center justify-center text-emerald-450 shadow-xl shadow-emerald-900/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-neutral-100 tracking-tight">
              Request Received!
            </h3>
            <p className="text-xs text-neutral-450 leading-relaxed max-w-sm mx-auto">
              Your {selectedType === 'feedback' ? 'feedback' : 'problem report'} has been successfully logged. Thank you for helping us improve Vyse.
            </p>
          </div>

          <DialogFooter>
            <button
              onClick={handleClose}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/10 cursor-pointer"
            >
              Close Window
            </button>
          </DialogFooter>
        </div>
      )}
    </DialogContent>
  );
}
