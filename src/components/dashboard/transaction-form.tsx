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

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number()
           .positive({ message: 'Amount must be greater than 0' }),
  accountId: z.string().min(1, { message: 'Account is required' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  date: z.string().min(1, { message: 'Date is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { accounts, categories, addTransaction } = useFinanceStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: undefined,
      accountId: '',
      categoryId: '',
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      description: ''
    }
  });

  const selectedType = watch('type');

  // Set default category when type changes
  useEffect(() => {
    const filteredCats = categories.filter(c => c.type === selectedType);
    if (filteredCats.length > 0) {
      setValue('categoryId', filteredCats[0].id);
    } else {
      setValue('categoryId', '');
    }
  }, [selectedType, categories, setValue]);

  // Set default account on mount if available
  useEffect(() => {
    if (accounts.length > 0) {
      setValue('accountId', accounts[0].id);
    }
  }, [accounts, setValue]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const success = await addTransaction({
        accountId: values.accountId,
        categoryId: values.categoryId,
        amount: values.amount,
        type: values.type,
        description: values.description,
        date: values.date
      });
      if (success) {
        reset({
          type: 'expense',
          amount: undefined,
          accountId: accounts[0]?.id || '',
          categoryId: categories.filter(c => c.type === 'expense')[0]?.id || '',
          date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          description: ''
        });
        onSuccess();
      }
    } catch (e) {
      console.error('Error submitting transaction:', e);
    }
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">Add New Transaction</DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Enter the financial ledger details to update account balance sheet in real-time.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
        {/* Transaction Type Segment Controller */}
        <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              selectedType === 'expense'
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/25 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              selectedType === 'income'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Amount ($)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-7 bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Account Select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Source Account</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
            {...register('accountId')}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-neutral-900 text-neutral-100">
                {acc.name} (${Math.abs(acc.balance).toFixed(2)})
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.accountId.message}</p>
          )}
        </div>

        {/* Category Select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Category</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
            {...register('categoryId')}
          >
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-neutral-900 text-neutral-100">
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Date Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Transaction Date</label>
          <Input
            type="datetime-local"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('date')}
          />
          {errors.date && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.date.message}</p>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Description</label>
          <Input
            type="text"
            placeholder="e.g. Whole Foods Groceries"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
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
              'Save Transaction'
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
