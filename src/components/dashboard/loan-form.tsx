"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const loanSchema = z.object({
  name: z.string().min(1, { message: 'Loan name is required' }),
  termMonths: z.number()
               .int().positive({ message: 'Term length must be a positive number of months' }),
  monthlyPayment: z.number()
                   .positive({ message: 'Payment amount must be greater than 0' }),
  paymentFrequency: z.enum(['monthly', 'bi-monthly']),
  firstPaymentDay: z.number().int().min(1).max(28),
  secondPaymentDay: z.number().int().min(1).max(28).optional(),
  startDate: z.string().min(1, { message: 'Start date is required' }),
}).refine((data) => {
  if (data.paymentFrequency === 'bi-monthly') {
    return data.secondPaymentDay !== undefined && data.secondPaymentDay > data.firstPaymentDay;
  }
  return true;
}, {
  message: '2nd payment day must be after the 1st payment day',
  path: ['secondPaymentDay'],
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  onSuccess: () => void;
}

export default function LoanForm({ onSuccess }: LoanFormProps) {
  const { addLoan, isTourActive } = useFinanceStore();
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      termMonths: 0,
      monthlyPayment: 0,
      paymentFrequency: 'monthly',
      firstPaymentDay: 1,
      secondPaymentDay: 15,
      startDate: new Date().toISOString().split('T')[0]
    }
  });

  // Live preview
  const watchTerm = watch('termMonths');
  const watchPayment = watch('monthlyPayment');
  const watchFrequency = watch('paymentFrequency');
  const isBiMonthly = watchFrequency === 'bi-monthly';
  const paymentsPerMonth = isBiMonthly ? 2 : 1;
  const totalDebt = (watchTerm || 0) * paymentsPerMonth * (watchPayment || 0);

  const onSubmit = async (values: LoanFormValues) => {
    try {
      const paymentsPerMo = values.paymentFrequency === 'bi-monthly' ? 2 : 1;
      const calculatedPrincipal = values.termMonths * paymentsPerMo * values.monthlyPayment;

      const confirmed = await confirm({
        title: 'Confirm New Loan Liability',
        message: `Are you sure you want to save the loan "${values.name}" with a calculated principal of ${formatCurrency(calculatedPrincipal)}?`,
        confirmText: 'Save Loan',
        type: 'info'
      });
      if (!confirmed) return;

      const success = await addLoan({
        name: values.name,
        principal: calculatedPrincipal,
        interestRate: 0,
        termMonths: values.termMonths,
        monthlyPayment: values.monthlyPayment,
        paymentFrequency: values.paymentFrequency,
        firstPaymentDay: values.firstPaymentDay,
        secondPaymentDay: values.paymentFrequency === 'bi-monthly' ? values.secondPaymentDay : undefined,
        startDate: values.startDate
      });
      if (success) {
        reset();
        onSuccess();
      }
    } catch (e) {
      console.error('Error adding loan:', e);
    }
  };

  return (
    <DialogContent id="tour-loan-form" className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100">Add Loan Liability</DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Track car loans, student loans, or mortgages. Set your payment schedule and the total debt is calculated automatically.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-3">
        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Loan Name</label>
          <Input
            type="text"
            placeholder="e.g. Toyota Financial Car Loan"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Payment Frequency Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-500">Payment Frequency</label>
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-850">
            <button
              type="button"
              onClick={() => {
                const e = { target: { name: 'paymentFrequency', value: 'monthly' } } as React.ChangeEvent<HTMLInputElement>;
                register('paymentFrequency').onChange(e);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                !isBiMonthly
                  ? 'bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm'
                  : 'text-neutral-550 hover:text-neutral-350'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => {
                const e = { target: { name: 'paymentFrequency', value: 'bi-monthly' } } as React.ChangeEvent<HTMLInputElement>;
                register('paymentFrequency').onChange(e);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                isBiMonthly
                  ? 'bg-neutral-850 text-neutral-100 border border-neutral-800 shadow-sm'
                  : 'text-neutral-550 hover:text-neutral-350'
              }`}
            >
              Bi-Monthly
            </button>
          </div>
          <input type="hidden" {...register('paymentFrequency')} />
        </div>

        {/* Term Months & Payment Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Term (Months)</label>
            <Input
              type="number"
              placeholder="60"
              className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
              {...register('termMonths', { valueAsNumber: true })}
            />
            {errors.termMonths && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.termMonths.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">Payment Amount ({getCurrencySymbol()})</label>
            <Input
              type="number"
              step="0.01"
              placeholder="350.00"
              className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
              {...register('monthlyPayment', { valueAsNumber: true })}
            />
            {errors.monthlyPayment && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.monthlyPayment.message}</p>
            )}
          </div>
        </div>

        {/* Payment Day(s) of Month */}
        <div className={`grid gap-4 ${isBiMonthly ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500">
              {isBiMonthly ? '1st Payment Day' : 'Payment Day of Month'}
            </label>
            <Input
              type="number"
              min={1}
              max={28}
              placeholder="1"
              className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
              {...register('firstPaymentDay', { valueAsNumber: true })}
            />
            {errors.firstPaymentDay && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.firstPaymentDay.message}</p>
            )}
          </div>

          {isBiMonthly && (
            <div className="space-y-1 animate-in fade-in slide-in-from-right-2 duration-200">
              <label className="text-xs font-semibold text-neutral-500">2nd Payment Day</label>
              <Input
                type="number"
                min={1}
                max={28}
                placeholder="15"
                className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
                {...register('secondPaymentDay', { valueAsNumber: true })}
              />
              {errors.secondPaymentDay && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.secondPaymentDay.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Auto-calculated Total Debt Preview */}
        {totalDebt > 0 && (
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Total Remaining Debt</span>
              <span className="text-sm font-extrabold text-indigo-600">{formatCurrency(totalDebt)}</span>
            </div>
            <p className="text-[10px] text-neutral-550">
              {watchTerm} months × {paymentsPerMonth} payment{paymentsPerMonth > 1 ? 's' : ''}/mo × {formatCurrency(watchPayment || 0)}
            </p>
          </div>
        )}

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-500">Start Date</label>
          <Input
            type="date"
            className="bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-neutral-100 rounded-lg"
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.startDate.message}</p>
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
              'Save Loan'
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
