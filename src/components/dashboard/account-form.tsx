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
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';
import { Account, deobfuscate } from '@/lib/db-mock';
import { AlertCircle } from 'lucide-react';

const accountSchema = z.object({
  name: z.string().min(1, { message: 'Account name is required' }),
  type: z.enum(['checking', 'savings', 'credit', 'cash']),
  initialBalance: z.number(),
  color: z.string().min(1, { message: 'Color is required' }),
  accountNumber: z.string().regex(/^\d*$/, { message: 'Account number must contain only numbers' }).optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  onSuccess: () => void;
  account?: Account;
}

export default function AccountForm({ onSuccess, account }: AccountFormProps) {
  const { addAccount, updateAccount, isTourActive } = useFinanceStore();
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = !!account;

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
      name: account?.name || '',
      type: account?.type || 'checking',
      initialBalance: account?.balance || 0,
      color: account?.color || 'blue',
      accountNumber: account?.account_number ? deobfuscate(account.account_number) : ''
    }
  });

  const selectedColor = watch('color');

  React.useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        initialBalance: account.balance,
        color: account.color,
        accountNumber: account.account_number ? deobfuscate(account.account_number) : ''
      });
    } else {
      reset({
        name: '',
        type: 'checking',
        initialBalance: 0,
        color: 'blue',
        accountNumber: ''
      });
    }
  }, [account, reset]);

  const confirm = useConfirm();

  const onSubmit = async (values: AccountFormValues) => {
    try {
      setError(null);
      const confirmed = await confirm({
        title: isEdit ? 'Confirm Save Changes' : 'Confirm New Account',
        message: isEdit 
          ? `Are you sure you want to save updates to the account "${values.name}"?`
          : `Are you sure you want to create the account "${values.name}" with an initial balance of ${formatCurrency(values.initialBalance)}?`,
        confirmText: isEdit ? 'Save Changes' : 'Create Account',
        type: 'info'
      });
      if (!confirmed) return;

      let success = false;
      if (isEdit && account) {
        success = await updateAccount(
          account.id,
          values.name,
          values.type,
          account.balance,
          values.color,
          values.accountNumber
        );
      } else {
        success = await addAccount(
          values.name,
          values.type,
          values.initialBalance,
          values.color,
          values.accountNumber
        );
      }
      if (success) {
        reset();
        onSuccess();
      } else {
        setError('Failed to save account. This can happen if the database schema is missing the account_number column. Please apply the migration or run the SQL command to add it.');
      }
    } catch (e) {
      console.error('Error submitting account form:', e);
      setError('An unexpected error occurred while saving the account.');
    }
  };

  return (
    <DialogContent id="tour-account-form" className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">
          {isEdit ? 'Edit Account' : 'Add Financial Account'}
        </DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          {isEdit 
            ? 'Update your account details and balance.' 
            : 'Create a checking, savings, cash, or credit account to track your money at hand.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-455 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
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

        {/* Balance Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">
            {isEdit ? `Current Balance (${getCurrencySymbol()})` : `Initial Balance (${getCurrencySymbol()})`}
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            disabled={isEdit}
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-900/50"
            {...register('initialBalance', { valueAsNumber: true })}
          />
          {errors.initialBalance && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.initialBalance.message}</p>
          )}
        </div>

        {/* Account Number Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Account Number</label>
          <Input
            type="text"
            placeholder="e.g. 1234567890"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('accountNumber', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
              }
            })}
          />
          {errors.accountNumber && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.accountNumber.message}</p>
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
            disabled={isSubmitting || isTourActive}
            className="h-10 px-4 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-98 text-white transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={isTourActive ? "Submit actions are disabled during the product tour" : undefined}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isEdit ? 'Save Changes' : 'Create Account'
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
