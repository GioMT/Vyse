"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { ACCOUNT_COLORS } from '@/lib/constants';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const accountSchema = z.object({
  name: z.string().min(1, { message: 'Account name is required' }),
  type: z.enum(['checking', 'savings', 'credit', 'cash']),
  initialBalance: z.number().min(0, { message: 'Initial balance must be positive' }),
  color: z.string().min(1, { message: 'Color is required' }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  onSuccess: () => void;
}

export default function AccountForm({ onSuccess }: AccountFormProps) {
  const { addAccount } = useFinanceStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'checking',
      initialBalance: 0,
      color: 'blue'
    }
  });

  const selectedColor = watch('color');

  const onSubmit = async (values: AccountFormValues) => {
    try {
      const success = await addAccount(
        values.name,
        values.type,
        values.initialBalance,
        values.color
      );
      if (success) {
        reset();
        onSuccess();
      }
    } catch (e) {
      console.error('Error adding account:', e);
    }
  };



  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">Add Financial Account</DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Create a checking, savings, cash, or credit account to track your money at hand.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Account Name</label>
          <Input
            type="text"
            placeholder="e.g. Marcus Savings 4.5%"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Type Select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Account Type</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
            {...register('type')}
          >
            <option value="checking">Checking / Debit</option>
            <option value="savings">Savings Account</option>
            <option value="credit">Credit Card</option>
            <option value="cash">Physical Cash / Other</option>
          </select>
          {errors.type && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Initial Balance */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Initial Balance ($)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('initialBalance', { valueAsNumber: true })}
          />
          {errors.initialBalance && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.initialBalance.message}</p>
          )}
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-500 block">Theme Color</label>
          <div className="flex gap-3">
            {ACCOUNT_COLORS.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('color', color.value)}
                className={`h-7 w-7 rounded-full ${color.class} transition-all duration-150 relative cursor-pointer active:scale-90 flex items-center justify-center`}
              >
                {selectedColor === color.value && (
                  <span className="absolute h-9 w-9 rounded-full border border-indigo-400 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
          {errors.color && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.color.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <DialogFooter className="pt-2 sm:justify-end gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Create Account'
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
