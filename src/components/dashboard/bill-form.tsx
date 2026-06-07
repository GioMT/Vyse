"use client";

import React, { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';

const billSchema = z.object({
  name: z.string().min(1, { message: 'Bill name is required' }),
  amount: z.number()
           .positive({ message: 'Amount must be greater than 0' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  nextDueDate: z.string().min(1, { message: 'Next due date is required' }),
  autoPay: z.boolean(),
});

type BillFormValues = z.infer<typeof billSchema>;

interface BillFormProps {
  onSuccess: () => void;
}

export default function BillForm({ onSuccess }: BillFormProps) {
  const { categories, addBill, isTourActive } = useFinanceStore();
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: '',
      amount: 0,
      categoryId: '',
      frequency: 'monthly',
      nextDueDate: new Date().toISOString().split('T')[0],
      autoPay: false
    }
  });

  // Filter categories to only expense categories
  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (expenseCategories.length > 0) {
      setValue('categoryId', expenseCategories[0].id);
    }
  }, [expenseCategories, setValue]);

  const onSubmit = async (values: BillFormValues) => {
    try {
      const confirmed = await confirm({
        title: 'Confirm Recurring Bill',
        message: `Are you sure you want to schedule a recurring ${values.frequency} payment of ${formatCurrency(values.amount)} for "${values.name}"?`,
        confirmText: 'Schedule Bill',
        type: 'info'
      });
      if (!confirmed) return;

      const success = await addBill({
        name: values.name,
        amount: values.amount,
        categoryId: values.categoryId,
        frequency: values.frequency,
        nextDueDate: values.nextDueDate,
        autoPay: values.autoPay
      });
      if (success) {
        reset();
        onSuccess();
      }
    } catch (e) {
      console.error('Error adding bill:', e);
    }
  };

  return (
    <DialogContent id="tour-bill-form" className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">Schedule Recurring Bill</DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Track recurring expenses such as rent, software subscriptions, or electricity bills.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Bill Name</label>
          <Input
            type="text"
            placeholder="e.g. Comcast Internet"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Bill Amount ({getCurrencySymbol()})</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Category Select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Category</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
            {...register('categoryId')}
          >
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-neutral-900 text-neutral-100">
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Frequency & Next Due Date row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Billing Cycle</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
              {...register('frequency')}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Next Due Date</label>
            <Input
              type="date"
              className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
              {...register('nextDueDate')}
            />
            {errors.nextDueDate && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.nextDueDate.message}</p>
            )}
          </div>
        </div>

        {/* Auto Pay Checkbox */}
        <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-neutral-950 border border-neutral-850">
          <input
            type="checkbox"
            id="autoPay"
            className="h-4 w-4 rounded bg-neutral-900 border-neutral-800 text-indigo-600 focus:ring-indigo-500"
            {...register('autoPay')}
          />
          <label htmlFor="autoPay" className="text-xs font-semibold text-neutral-100 cursor-pointer select-none">
            Auto-Pay simulation (Automatically deduct from Checking on due date)
          </label>
        </div>

        {/* Form Actions */}
        <DialogFooter className="pt-2 sm:justify-end gap-2">
          <button
            type="submit"
            disabled={isSubmitting || isTourActive}
            className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={isTourActive ? "Submit actions are disabled during the product tour" : undefined}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Schedule Bill'
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
