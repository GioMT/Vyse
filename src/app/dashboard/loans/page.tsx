"use client";

import React, { useState } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Loan, Transaction } from '@/lib/db-mock';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import LoanForm from '@/components/dashboard/loan-form';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { 
  PiggyBank, 
  Plus, 
  TrendingDown, 
  CheckCircle,
  CircleDollarSign
} from 'lucide-react';

// Helper functions for next payment schedule calculations
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return 'st';
    case 2:  return 'nd';
    case 3:  return 'rd';
    default: return 'th';
  }
}

function formatScheduleDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

function isTransactionForLoan(tx: Transaction, loan: Loan): boolean {
  const desc = tx.description.toLowerCase();
  const name = loan.name.toLowerCase();
  if (desc.includes(name)) return true;
  if (desc.includes('loan payment:') && desc.includes(name)) return true;
  // Match specific mock transaction cases
  if (name.includes('tesla') && desc.includes('tesla')) return true;
  if (name.includes('sallie mae') && desc.includes('sallie mae')) return true;
  return false;
}

function getScheduledDatesForMonth(year: number, month: number, loan: Loan): Date[] {
  const dates: Date[] = [];
  const firstDay = loan.first_payment_day || 1;
  dates.push(new Date(year, month, firstDay));

  if (loan.payment_frequency === 'bi-monthly') {
    const secondDay = loan.second_payment_day || 15;
    dates.push(new Date(year, month, secondDay));
  }
  
  return dates;
}

function getNextPaymentSchedule(loan: Loan, transactions: Transaction[], today: Date): { date: Date; isPastDue: boolean } {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Generate candidate dates from 3 months ago to 6 months in the future
  let allSchedules: Date[] = [];
  for (let offset = -3; offset <= 6; offset++) {
    const targetDate = new Date(currentYear, currentMonth + offset, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    allSchedules = allSchedules.concat(
      getScheduledDatesForMonth(targetYear, targetMonth, loan)
    );
  }

  // Sort chronologically
  allSchedules.sort((a, b) => a.getTime() - b.getTime());

  // Find S_0: the last scheduled date that is <= today
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let s0Idx = 0;
  for (let i = 0; i < allSchedules.length; i++) {
    const sDate = new Date(allSchedules[i].getFullYear(), allSchedules[i].getMonth(), allSchedules[i].getDate());
    if (sDate.getTime() <= todayMidnight.getTime()) {
      s0Idx = i;
    }
  }

  // S_{-1} is the scheduled date before S_0
  const sMinus1 = s0Idx > 0 ? allSchedules[s0Idx - 1] : new Date(allSchedules[s0Idx].getTime() - 15 * 24 * 60 * 60 * 1000);

  // Count transactions for this loan that occurred after S_{-1}
  const sMinus1Midnight = new Date(sMinus1.getFullYear(), sMinus1.getMonth(), sMinus1.getDate());
  const eligibleTxs = transactions.filter((tx) => {
    if (!isTransactionForLoan(tx, loan)) return false;
    const txDate = parseLocalDate(tx.date);
    return txDate.getTime() > sMinus1Midnight.getTime();
  });

  const paymentCount = eligibleTxs.length;

  // The next unpaid schedule is S_{paymentCount} starting from S_0
  const targetIdx = s0Idx + paymentCount;
  const nextScheduleDate = allSchedules[targetIdx] || allSchedules[allSchedules.length - 1];

  const nextScheduleMidnight = new Date(nextScheduleDate.getFullYear(), nextScheduleDate.getMonth(), nextScheduleDate.getDate());

  return {
    date: nextScheduleDate,
    isPastDue: todayMidnight.getTime() > nextScheduleMidnight.getTime(),
  };
}

export default function LoansPage() {
  const { 
    loans, 
    accounts, 
    transactions,
    makeLoanPayment 
  } = useFinanceStore();

  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const defaultAcc = accounts.find(a => a.type === 'checking') || accounts[0];
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAcc?.id || '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [includeLateCharge, setIncludeLateCharge] = useState(false);
  const [lateChargeAmount, setLateChargeAmount] = useState('');
  const [comment, setComment] = useState('');

  React.useEffect(() => {
    const defaultAcc = accounts.find(a => a.type === 'checking') || accounts[0];
    if (defaultAcc && !selectedAccountId) {
      const timer = setTimeout(() => setSelectedAccountId(defaultAcc.id), 0);
      return () => clearTimeout(timer);
    }
  }, [accounts, selectedAccountId]);

  // Calculations
  const totalOwed = loans.reduce((sum, l) => sum + l.remaining_balance, 0);
  const totalPaid = loans.reduce((sum, l) => sum + l.paid_amount, 0);
  const totalDebt = totalOwed + totalPaid;
  const overallProgress = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !selectedAccountId || !paymentAmount) {
      alert('Please fill out all payment fields.');
      return;
    }
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    const fee = includeLateCharge ? parseFloat(lateChargeAmount) : 0;
    if (includeLateCharge && (isNaN(fee) || fee < 0)) {
      alert('Please enter a valid non-negative additional charge.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await makeLoanPayment(
        selectedLoanId, 
        selectedAccountId, 
        amt, 
        includeLateCharge ? fee : undefined, 
        includeLateCharge ? comment : undefined
      );
      if (success) {
        setSelectedLoanId('');
        setPaymentAmount('');
        setLateChargeAmount('');
        setComment('');
        setIncludeLateCharge(false);
        alert('Payment successfully credited to loan and logged in ledger!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Loans & Debt Tracker</h1>
          <p className="text-xs text-neutral-500 mt-1">Track loan liabilities, monitor payment schedules, and accelerate debt payoff.</p>
        </div>

        {/* Add Loan Dialog */}
        <Dialog open={loanDialogOpen} onOpenChange={setLoanDialogOpen}>
          <DialogTrigger
            render={
              <button className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Track Loan</span>
              </button>
            }
          />
          <LoanForm onSuccess={() => setLoanDialogOpen(false)} />
        </Dialog>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Owed */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Remaining Debt</span>
            <h3 className="text-xl font-extrabold text-neutral-100">{formatCurrency(totalOwed)}</h3>
            <p className="text-[10px] text-neutral-550">Principal balance outstanding</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Total Debt Payment</span>
            <h3 className="text-xl font-extrabold text-emerald-600">{formatCurrency(totalPaid)}</h3>
            <p className="text-[10px] text-neutral-550">Amount paid toward loans</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Overall Progress */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Payoff Progress</span>
              <h3 className="text-xl font-extrabold text-indigo-600">{overallProgress.toFixed(1)}%</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={overallProgress} className="h-2 bg-neutral-950 border border-neutral-850/50" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {loans.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Loan Cards List */}
          <div className="lg:col-span-2 space-y-4">
            {loans.map((loan) => {
              const loanPaidPct = (loan.paid_amount / (loan.remaining_balance + loan.paid_amount)) * 100 || 0;
              return (
                <div 
                  key={loan.id}
                  className="rounded-xl bg-neutral-900 border border-neutral-850 p-6 space-y-4 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-neutral-100">{loan.name}</h3>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Started {new Date(loan.start_date + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                        (loan.payment_frequency || 'monthly') === 'bi-monthly'
                          ? 'text-purple-600 bg-purple-500/5 border-purple-500/15'
                          : 'text-neutral-500 bg-neutral-950 border-neutral-850'
                      }`}>
                        {(loan.payment_frequency || 'monthly') === 'bi-monthly' ? 'Bi-Monthly' : 'Monthly'}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                        {formatCurrency(loan.monthly_payment)}{(loan.payment_frequency || 'monthly') === 'bi-monthly' ? '/payment' : '/mo'}
                      </span>
                    </div>
                  </div>

                  {/* Progress details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Paid: {formatCurrency(loan.paid_amount)}</span>
                      <span className="font-bold text-indigo-600">{loanPaidPct.toFixed(1)}% paid</span>
                      <span className="text-neutral-500 font-medium">Owed: {formatCurrency(loan.remaining_balance)}</span>
                    </div>
                    <Progress value={loanPaidPct} className="h-2.5 bg-neutral-950 border border-neutral-850/50" />
                  </div>

                  {/* Loan Details Panel */}
                  <div className="grid grid-cols-3 gap-4 pt-2 text-center border-t border-neutral-850/50">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Total Debt</span>
                      <span className="text-xs font-bold text-neutral-100 mt-1 block">{formatCurrency(loan.principal)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Next Payment Schedule</span>
                      <span className="text-xs font-bold text-neutral-100 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                        {(() => {
                          const today = new Date();
                          const nextSchedule = getNextPaymentSchedule(loan, transactions, today);
                          return (
                            <>
                              <span>{formatScheduleDate(nextSchedule.date)}</span>
                              {nextSchedule.isPastDue && (
                                <span className="text-[9px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-semibold uppercase tracking-wider shrink-0 animate-pulse">
                                  Past Due
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">Remaining Cycle</span>
                      <span className="text-xs font-bold text-neutral-100 mt-1 block">
                        {Math.max(0, Math.ceil(loan.remaining_balance / loan.monthly_payment))} payments left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Amortization Payment Tool */}
          <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 shadow-md">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-100">Debt Payment Tool</h3>
              <p className="text-xs text-neutral-500">Make an extra payment to reduce your loan balance faster.</p>
            </div>

            <form onSubmit={handleMakePayment} className="mt-5 space-y-4">
              {/* Select Loan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Select Loan</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedLoanId(nextId);
                    const selectedLoan = loans.find(l => l.id === nextId);
                    if (selectedLoan) {
                      setPaymentAmount(selectedLoan.monthly_payment.toString());
                    } else {
                      setPaymentAmount('');
                    }
                  }}
                  className="w-full h-9.5 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a loan...</option>
                  {loans.map(l => (
                    <option key={l.id} value={l.id}>{l.name} (${l.remaining_balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* Funding Account */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Deduct Funds From</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500">Payment Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-7 bg-neutral-950 border-neutral-800 text-xs focus:border-indigo-500 text-neutral-100 rounded-lg h-9.5"
                  />
                </div>
              </div>

              {/* Include Additional Charge Toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-neutral-500">Include Additional Charges</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeLateCharge}
                    onChange={(e) => setIncludeLateCharge(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-550 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-neutral-800"></div>
                </label>
              </div>

              {/* Conditional Inputs for Additional Charges and Comments */}
              {includeLateCharge && (
                <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Additional Charge Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Additional Charge Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={lateChargeAmount}
                        onChange={(e) => setLateChargeAmount(e.target.value)}
                        className="pl-7 bg-neutral-950 border-neutral-800 text-xs focus:border-indigo-500 text-neutral-100 rounded-lg h-9.5"
                      />
                    </div>
                  </div>

                  {/* Comment / Memo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500">Comment / Memo</label>
                    <Input
                      type="text"
                      placeholder="e.g. Processing fee, late charge, etc."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-xs focus:border-indigo-500 text-neutral-100 rounded-lg h-9.5"
                    />
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {includeLateCharge && parseFloat(lateChargeAmount) > 0 && (
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <span className="text-neutral-500 font-medium">Total Charge (Expenses):</span>
                  <span className="font-extrabold text-indigo-600">
                    {formatCurrency(parseFloat(paymentAmount || '0') + parseFloat(lateChargeAmount || '0'))}
                  </span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Apply Payment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-850 bg-neutral-900/10 p-12 text-center flex flex-col gap-1 items-center justify-center max-w-lg mx-auto">
          <PiggyBank className="h-8 w-8 text-neutral-550 mb-2" />
          <h4 className="font-bold text-neutral-100 text-sm">No active loan liabilities</h4>
          <p className="text-xs text-neutral-500">Track student debt, vehicle financing, or mortgage principal balances easily.</p>
        </div>
      )}
    </div>
  );
}
