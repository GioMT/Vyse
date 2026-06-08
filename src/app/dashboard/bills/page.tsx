"use client";

import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import BillForm from '@/components/dashboard/bill-form';
import { formatCurrency } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';
import { 
  CalendarDays, 
  Plus, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Zap
} from 'lucide-react';

export default function BillsPage() {
  const { 
    bills, 
    accounts, 
    categories, 
    payBill 
  } = useFinanceStore();

  const confirm = useConfirm();

  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  // Programmatic event listener to open/close bill modal during product tour
  useEffect(() => {
    const handleOpen = () => setBillDialogOpen(true);
    const handleClose = () => setBillDialogOpen(false);
    window.addEventListener('vyse_open_add_bill', handleOpen);
    window.addEventListener('vyse_close_add_bill', handleClose);
    return () => {
      window.removeEventListener('vyse_open_add_bill', handleOpen);
      window.removeEventListener('vyse_close_add_bill', handleClose);
    };
  }, []);
  
  // Default paying account (checking or debit if available)
  const defaultAccount = accounts.find(a => a.type === 'checking') || accounts[0];
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccount?.id || '');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine status
  const getBillStatus = (dueDate: string) => {
    if (dueDate < todayStr) return 'overdue';
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    const limitStr = limit.toISOString().split('T')[0];
    if (dueDate <= limitStr) return 'due-soon';
    return 'normal';
  };

  const handlePayBill = async (billId: string) => {
    const accId = selectedAccountId || defaultAccount?.id;
    if (!accId) {
      await confirm({
        title: 'Account Required',
        message: 'Please create a financial account first to process invoice payments.',
        confirmText: 'OK',
        type: 'warning',
        isAlert: true
      });
      return;
    }
    
    const bill = bills.find(b => b.id === billId);
    const billName = bill ? bill.name : 'bill';
    const billAmountStr = bill ? formatCurrency(bill.amount) : 'invoice amount';
    const accName = accounts.find(a => a.id === accId)?.name || 'selected account';

    const confirmed = await confirm({
      title: 'Confirm Bill Payment',
      message: `Are you sure you want to process payment for "${billName}" of ${billAmountStr}? This will deduct the funds from "${accName}".`,
      confirmText: 'Confirm Payment',
      type: 'info'
    });
    if (!confirmed) return;

    try {
      const success = await payBill(billId, accId);
      if (success) {
        setPayingBillId(null);
        await confirm({
          title: 'Bill Paid',
          message: `Successfully processed payment for "${billName}" of ${billAmountStr}!`,
          confirmText: 'OK',
          type: 'success',
          isAlert: true
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations
  const totalBillsAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const overdueBills = bills.filter(b => getBillStatus(b.next_due_date) === 'overdue');
  const dueSoonBills = bills.filter(b => getBillStatus(b.next_due_date) === 'due-soon');

  if (!mounted) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Recurring Bills</h1>
            <p className="text-xs text-neutral-500 mt-1">Monitor, schedule, and automate your recurring subscriptions and service invoices.</p>
          </div>
        </div>
        <div className="h-40 w-full rounded-xl bg-neutral-900 border border-neutral-850 animate-pulse" />
      </div>
    );
  }



  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Recurring Bills</h1>
          <p className="text-xs text-neutral-500 mt-1">Monitor, schedule, and automate your recurring subscriptions and service invoices.</p>
        </div>

        {/* Schedule Bill Dialog */}
        <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
          <DialogTrigger
            render={
              <button id="tour-add-bill" className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Schedule Bill</span>
              </button>
            }
          />
          <BillForm onSuccess={() => setBillDialogOpen(false)} />
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div id="tour-bills-summary" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Cost */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Scheduled Volume</span>
            <h3 className="text-xl font-extrabold text-neutral-100">{formatCurrency(totalBillsAmount)}</h3>
            <p className="text-[10px] text-neutral-550">Sum of all scheduled entries</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Overdue Bills</span>
            <h3 className="text-xl font-extrabold text-rose-600">{overdueBills.length} active</h3>
            <p className="text-[10px] text-neutral-550">Requires immediate attention</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Due Soon */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Due in 7 Days</span>
            <h3 className="text-xl font-extrabold text-amber-600">{dueSoonBills.length} bills</h3>
            <p className="text-[10px] text-neutral-550">Pending upcoming payouts</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div id="tour-bills-list">
        {bills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bills.map((bill) => {
              const status = getBillStatus(bill.next_due_date);
              const cat = categories.find(c => c.id === bill.category_id);
              
              return (
                <div 
                  key={bill.id}
                  className="rounded-xl bg-neutral-900 border border-neutral-850 p-5 flex flex-col justify-between shadow-md hover:border-neutral-800 transition-all duration-200"
                >
                  <div>
                    {/* Top Badge header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850 uppercase">
                        {bill.frequency}
                      </span>
  
                      {/* Status Badge */}
                      {status === 'overdue' && (
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-500/5 px-2.5 py-0.5 rounded-full border border-rose-500/15 uppercase tracking-wide">
                          Overdue
                        </span>
                      )}
                      {status === 'due-soon' && (
                        <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/5 px-2.5 py-0.5 rounded-full border border-amber-500/15 uppercase tracking-wide">
                          Due Soon
                        </span>
                      )}
                      {status === 'normal' && (
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-500/5 px-2.5 py-0.5 rounded-full border border-indigo-500/15 uppercase tracking-wide">
                          Scheduled
                        </span>
                      )}
                    </div>
  
                    {/* Body Info */}
                    <div className="mt-4">
                      <h4 className="font-bold text-neutral-100 text-sm truncate">{bill.name}</h4>
                      <p className="text-[10px] text-neutral-550 mt-0.5">Category: {cat ? cat.name : 'Expenses'}</p>
                      
                      <div className="flex items-baseline gap-1 mt-2.5">
                        <span className="text-xl font-extrabold text-neutral-100">{formatCurrency(bill.amount)}</span>
                        <span className="text-[10px] text-neutral-550">/{bill.frequency === 'weekly' ? 'wk' : bill.frequency === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    </div>
                  </div>
  
                  {/* Footer Pay Trigger */}
                  <div className="border-t border-neutral-850 mt-5 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs text-neutral-500">
                      <span>Next Due Date:</span>
                      <span className={`font-bold ${status === 'overdue' ? 'text-rose-600' : 'text-neutral-500'}`}>
                        {new Date(bill.next_due_date + 'T00:00:00').toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </span>
                    </div>
  
                    {bill.auto_pay && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-500/5 py-1 px-2.5 rounded-lg border border-emerald-500/10">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Auto-Pay enabled (processed daily)</span>
                      </div>
                    )}
  
                    {payingBillId === bill.id ? (
                      <div className="flex flex-col gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-850 animate-in fade-in duration-150">
                        <span className="text-[10px] font-semibold text-neutral-500 block">Deduct funds from:</span>
                        <select
                          value={selectedAccountId}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className="h-8 w-full px-2 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-100 focus:outline-none"
                        >
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                          ))}
                        </select>
                        
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            className="flex-1 h-7.5 text-[10px] font-bold rounded bg-indigo-600 hover:bg-indigo-550 text-white flex items-center justify-center cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setPayingBillId(null)}
                            className="h-7.5 px-3.5 text-[10px] font-bold rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-500 flex items-center justify-center cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setPayingBillId(bill.id);
                          setSelectedAccountId(defaultAccount?.id || '');
                        }}
                        className="h-8.5 w-full rounded-lg bg-neutral-850 hover:bg-neutral-800 active:scale-97 text-xs font-bold text-neutral-400 hover:text-neutral-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Pay Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10 p-12 text-center flex flex-col gap-1 items-center justify-center max-w-lg mx-auto">
            <CalendarDays className="h-8 w-8 text-neutral-600 mb-2" />
            <h4 className="font-bold text-neutral-300 text-sm">No recurring bills scheduled</h4>
            <p className="text-xs text-neutral-500">Add bills like rent, gym membership, or utility accounts to automate tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}
