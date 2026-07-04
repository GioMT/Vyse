"use client";

import React, { useState, useEffect } from 'react';
import { useFinanceStore, TimeFilter } from '@/hooks/use-finance-store';
import StatsCards from '@/components/dashboard/stats-cards';
import Charts from '@/components/dashboard/charts';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import TransactionForm from '@/components/dashboard/transaction-form';
// import AccountForm from '@/components/dashboard/account-form';
import { parseDescription, formatCurrency } from '@/lib/format';
import { CATEGORY_COLOR_CLASSES } from '@/lib/constants';
import { useConfirm } from '@/components/ui/confirmation-provider';
import { 
  Plus, 
  Trash2
} from 'lucide-react';

export default function DashboardHome() {
  const { 
    user, 
    accounts, 
    categories, 
    transactions, 
    timeFilter, 
    customDateRange,
    setTimeFilter,
    setCustomDateRange,
    deleteTransaction
  } = useFinanceStore();

  const confirm = useConfirm();

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  // const [accDialogOpen, setAccDialogOpen] = useState(false);

  // Programmatic event listener to open/close transaction modal during product tour
  useEffect(() => {
    const handleOpen = () => setTxDialogOpen(true);
    const handleClose = () => setTxDialogOpen(false);
    window.addEventListener('vyse_open_add_tx', handleOpen);
    window.addEventListener('vyse_close_add_tx', handleClose);
    return () => {
      window.removeEventListener('vyse_open_add_tx', handleOpen);
      window.removeEventListener('vyse_close_add_tx', handleClose);
    };
  }, []);

  // Time Filtering Helper
  const getFilteredTransactions = () => {
    const today = new Date();
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.date + 'T00:00:00');
      
      switch (timeFilter) {
        case '7d': {
          const limit = new Date();
          limit.setDate(today.getDate() - 7);
          return txDate >= limit;
        }
        case '30d': {
          const limit = new Date();
          limit.setDate(today.getDate() - 30);
          return txDate >= limit;
        }
        case 'this-month': {
          return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        }
        case 'last-month': {
          const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
          const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
          return txDate.getMonth() === lastMonth && txDate.getFullYear() === year;
        }
        case 'custom': {
          const fromDate = customDateRange.from ? new Date(customDateRange.from + 'T00:00:00') : null;
          const toDate = customDateRange.to ? new Date(customDateRange.to + 'T00:00:00') : null;
          if (fromDate && toDate) {
            return txDate >= fromDate && txDate <= toDate;
          }
          if (fromDate) return txDate >= fromDate;
          if (toDate) return txDate <= toDate;
          return true;
        }
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredTxs = getFilteredTransactions();

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 w-full max-w-7xl mx-auto">
      {/* Top Banner: Greeting and Global Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">
            Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent font-extrabold">{user?.full_name || 'Alex Mercer'}</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Here is a secure summary of your workspace finance portfolio</p>
        </div>

        {/* Global Filter Bar */}
        <div id="tour-range-filter" className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Range:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="h-9 px-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs if 'custom' is active */}
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                type="date"
                value={customDateRange.from || ''}
                onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value || null })}
                className="h-9 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-neutral-600">to</span>
              <input
                type="date"
                value={customDateRange.to || ''}
                onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value || null })}
                className="h-9 px-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div id="tour-stats">
        <StatsCards accounts={accounts} filteredTransactions={filteredTxs} />
      </div>

      {/* Visual Analytics Charts */}
      <div id="tour-charts">
        <Charts filteredTransactions={filteredTxs} categories={categories} />
      </div>

      {/* Grid: Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Recent Ledger */}
        <div id="tour-transactions" className="lg:col-span-12 rounded-2xl bg-neutral-900 border border-neutral-850 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-300">Recent Transactions</h3>
              <p className="text-xs text-neutral-550 mt-0.5">Quick overview of your latest cash flow actions</p>
            </div>
            
            {/* Add Transaction Dialog Button */}
            <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
              <DialogTrigger
                render={
                  <button id="tour-add-tx" className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Transaction</span>
                  </button>
                }
              />
              <TransactionForm onSuccess={() => setTxDialogOpen(false)} />
            </Dialog>
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredTxs.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-850 text-neutral-500 font-semibold uppercase tracking-wider pb-3">
                    <th className="py-2.5 hidden sm:table-cell">Date</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 hidden md:table-cell">Account</th>
                    <th className="py-2.5 text-right">Amount</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-neutral-300">
                  {filteredTxs.slice(0, 5).map((tx) => {
                    const cat = categories.find(c => c.id === tx.category_id);
                    const acc = accounts.find(a => a.id === tx.account_id);
                    const catColor = cat ? CATEGORY_COLOR_CLASSES[cat.color] : 'bg-neutral-800 text-neutral-400';
                    const { cleanDesc, fee } = parseDescription(tx.description);
                    const baseAmount = tx.amount - fee;
                    return (
                      <tr key={tx.id} className="hover:bg-neutral-850/30 transition-colors group">
                        <td className="py-3.5 text-neutral-400 hidden sm:table-cell">
                          {new Date(tx.date).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </td>
                        <td className="py-3.5 font-medium text-neutral-100">{cleanDesc}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catColor}`}>
                            {cat ? cat.name : 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-3.5 text-neutral-400 hidden md:table-cell">{acc ? acc.name : 'Unknown Account'}</td>
                        <td className="py-3.5 text-right">
                          <div className={`font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(baseAmount)}
                          </div>
                          {fee > 0 && (
                            <div className="text-[10px] text-neutral-550 font-medium">
                              + {formatCurrency(fee)} charge
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Delete Transaction',
                                message: 'Are you sure you want to permanently delete this transaction? This action will adjust your account balance and cannot be undone.',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                                type: 'danger'
                              });
                              if (confirmed) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-neutral-500 flex flex-col gap-1 items-center justify-center">
                <span>No transactions found in this date range.</span>
                <span className="text-[10px] text-neutral-600">Create a transaction to start updating your ledger.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
      ========================================================================
      TEMPLATE SAVED: Add Account Form Dialog & Trigger (for future transfer)
      ========================================================================
      import AccountForm from '@/components/dashboard/account-form';
      const [accDialogOpen, setAccDialogOpen] = useState(false);

      <Dialog open={accDialogOpen} onOpenChange={setAccDialogOpen}>
        <DialogTrigger
          render={
            <button className="h-8.5 w-8.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-95 text-neutral-400 hover:text-neutral-100 flex items-center justify-center cursor-pointer transition-all duration-150">
              <Plus className="h-4.5 w-4.5" />
            </button>
          }
        />
        <AccountForm onSuccess={() => setAccDialogOpen(false)} />
      </Dialog>
      ========================================================================
      */}
    </div>
  );
}
