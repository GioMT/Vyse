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
import { Info } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  accountId: z.string().min(1, { message: 'Source account is required' }),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().min(1, { message: 'Date is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  additionalCharge: z.number().nonnegative({ message: 'Cannot be negative' }).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer') {
    if (!data.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toAccountId'],
        message: 'Destination account is required'
      });
    } else if (data.toAccountId === data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toAccountId'],
        message: 'Source and destination accounts must be different'
      });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Category is required'
      });
    }
  }
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { accounts, categories, addTransaction } = useFinanceStore();
  const confirm = useConfirm();

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
      toAccountId: '',
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      description: '',
      additionalCharge: undefined
    }
  });

  const selectedType = watch('type');

  // Set default category when type changes
  useEffect(() => {
    if (selectedType === 'transfer') {
      setValue('categoryId', '');
    } else {
      const filteredCats = categories.filter(c => c.type === selectedType);
      if (filteredCats.length > 0) {
        setValue('categoryId', filteredCats[0].id);
      } else {
        setValue('categoryId', '');
      }
    }
  }, [selectedType, categories, setValue]);

  // Set default account on mount if available
  useEffect(() => {
    if (accounts.length > 0) {
      setValue('accountId', accounts[0].id);
      if (accounts.length > 1) {
        setValue('toAccountId', accounts[1].id);
      } else {
        setValue('toAccountId', accounts[0].id);
      }
    }
  }, [accounts, setValue]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const confirmed = await confirm({
        title: 'Confirm New Transaction',
        message: `Are you sure you want to log this ${values.type} of ${formatCurrency(values.amount)} for "${values.description}"?`,
        confirmText: 'Create Transaction',
        type: 'info'
      });
      if (!confirmed) return;

      const success = await addTransaction({
        accountId: values.accountId,
        categoryId: values.type === 'transfer' ? undefined : values.categoryId,
        toAccountId: values.type === 'transfer' ? values.toAccountId : undefined,
        amount: values.amount,
        type: values.type,
        description: values.description,
        date: values.date,
        additionalCharge: typeof values.additionalCharge === 'number' ? values.additionalCharge : 0
      });
      if (success) {
        reset({
          type: 'expense',
          amount: undefined,
          accountId: accounts[0]?.id || '',
          categoryId: categories.filter(c => c.type === 'expense')[0]?.id || '',
          toAccountId: accounts[1]?.id || accounts[0]?.id || '',
          date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          description: '',
          additionalCharge: undefined
        });
        onSuccess();
      }
    } catch (e) {
      console.error('Error submitting transaction:', e);
    }
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <DialogContent id="tour-transaction-form" className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
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
                : 'text-neutral-550 hover:text-neutral-350'
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
                : 'text-neutral-555 hover:text-neutral-350'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'transfer')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              selectedType === 'transfer'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-sm'
                : 'text-neutral-555 hover:text-neutral-350'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Amount ({getCurrencySymbol()})</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">{getCurrencySymbol()}</span>
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

        {/* Source Account Select */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">
            {selectedType === 'transfer' ? 'Source Account' : 'Source Account'}
          </label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
            {...register('accountId')}
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-neutral-900 text-neutral-100">
                {acc.name} ({formatCurrency(acc.balance)})
              </option>
            ))}
          </select>
          {errors.accountId && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.accountId.message}</p>
          )}
        </div>

        {/* Destination Account Select (Only for Transfer) */}
        {selectedType === 'transfer' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Destination Account</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
              {...register('toAccountId')}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-neutral-900 text-neutral-100">
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {errors.toAccountId && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.toAccountId.message}</p>
            )}
          </div>
        )}

        {/* Category Select (Hidden for Transfer) */}
        {selectedType !== 'transfer' && (
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
        )}

        {/* Additional Charges (For Expense and Transfer) */}
        {(selectedType === 'expense' || selectedType === 'transfer') && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-neutral-500">Additional Charges ({getCurrencySymbol()})</label>
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-neutral-500 hover:text-neutral-350 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 shadow-xl z-50 text-center leading-normal">
                  Specify card processing fees, transfer commissions, or extra overhead charges.
                </div>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">{getCurrencySymbol()}</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
                {...register('additionalCharge', { valueAsNumber: true })}
              />
            </div>
            {errors.additionalCharge && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.additionalCharge.message}</p>
            )}
          </div>
        )}

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
