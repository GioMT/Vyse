"use client";

import React from 'react';
import { Account, Transaction } from '@/lib/db-mock';
import { formatCurrency } from '@/lib/format';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  Landmark,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { ACCOUNT_COLOR_CLASSES } from '@/lib/constants';

interface StatsCardsProps {
  accounts: Account[];
  filteredTransactions: Transaction[];
}

export default function StatsCards({ accounts, filteredTransactions }: StatsCardsProps) {
  // 1. Total balance across all accounts
  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  // 2. Inflow / Outflow in date range
  let totalIncome = 0;
  let totalExpense = 0;

  filteredTransactions.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const savingsAccounts = accounts.filter(acc => acc.type === 'savings');
  const totalSavings = savingsAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const savingsCount = savingsAccounts.length;

  const statItems = [
    {
      title: 'Net Worth Balance',
      value: formatCurrency(totalBalance),
      change: 'All accounts linked',
      changeType: 'neutral',
      icon: Wallet,
      color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
      gradient: 'from-indigo-600/10 to-transparent'
    },
    {
      title: 'Net Savings',
      value: formatCurrency(totalSavings),
      change: `${savingsCount} account${savingsCount === 1 ? '' : 's'} linked`,
      changeType: 'neutral',
      icon: PiggyBank,
      color: totalSavings >= 0 ? 'text-teal-600 bg-teal-500/10 border-teal-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      gradient: totalSavings >= 0 ? 'from-teal-600/10 to-transparent' : 'from-amber-600/10 to-transparent'
    },
    {
      title: 'Inflow / Income',
      value: formatCurrency(totalIncome),
      change: `${filteredTransactions.filter(t => t.type === 'income').length} items`,
      changeType: 'up',
      icon: ArrowUpRight,
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
      gradient: 'from-emerald-600/10 to-transparent'
    },
    {
      title: 'Outflow / Expenses',
      value: formatCurrency(totalExpense),
      change: `${filteredTransactions.filter(t => t.type === 'expense').length} items`,
      changeType: 'down',
      icon: ArrowDownRight,
      color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
      gradient: 'from-rose-600/10 to-transparent'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        
        const CardContent = (
          <div 
            className={`relative rounded-2xl bg-neutral-900 border border-neutral-850 p-6 overflow-hidden flex flex-col justify-between shadow-lg w-full h-full text-left transition-all duration-200 ${
              idx === 0 || idx === 1
                ? 'cursor-pointer hover:scale-[1.02] hover:border-neutral-750' 
                : ''
            }`}
          >
            {/* Top glass reflection and subtle gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient} opacity-50`} />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{item.title}</span>
                <span className="text-2xl font-extrabold text-neutral-100 tracking-tight">{item.value}</span>
              </div>
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
              {item.changeType === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
              {item.changeType === 'down' && <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
              <span className={
                item.changeType === 'up' 
                  ? 'text-emerald-600 font-semibold' 
                  : item.changeType === 'down' 
                    ? 'text-rose-600 font-semibold' 
                    : 'text-neutral-500'
              }>
                {item.change}
              </span>
            </div>
          </div>
        );

        if (idx === 0) {
          return (
            <Dialog key={idx}>
              <DialogTrigger nativeButton={false} render={CardContent} />
              <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-neutral-100">Linked Accounts</DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500">
                    Asset & liability sheet of all your linked checking, savings, credit cards, and cash accounts.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {accounts.map((acc) => {
                    const borderClass = ACCOUNT_COLOR_CLASSES[acc.color] || 'border-neutral-800 text-neutral-400 bg-neutral-850/5';
                    return (
                      <div 
                        key={acc.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border ${borderClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-neutral-950/60 flex items-center justify-center shrink-0 border border-neutral-800/40">
                            {acc.type === 'checking' || acc.type === 'savings' ? (
                              <Landmark className="h-4.5 w-4.5" />
                            ) : acc.type === 'credit' ? (
                              <CreditCard className="h-4.5 w-4.5" />
                            ) : (
                              <DollarSign className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-neutral-100">{acc.name}</h4>
                            <p className="text-[10px] capitalize text-neutral-500 mt-0.5">{acc.type} account</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-neutral-100">
                            {formatCurrency(acc.balance)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          );
        }

        if (idx === 1) {
          return (
            <Dialog key={idx}>
              <DialogTrigger nativeButton={false} render={CardContent} />
              <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-neutral-100">Savings Accounts</DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500">
                    A list of all savings accounts linked to your portfolio.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {savingsAccounts.length > 0 ? (
                    savingsAccounts.map((acc) => {
                      const borderClass = ACCOUNT_COLOR_CLASSES[acc.color] || 'border-neutral-800 text-neutral-400 bg-neutral-850/5';
                      return (
                        <div 
                          key={acc.id} 
                          className={`flex items-center justify-between p-4 rounded-xl border ${borderClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-neutral-950/60 flex items-center justify-center shrink-0 border border-neutral-800/40">
                              <Landmark className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-neutral-100">{acc.name}</h4>
                              <p className="text-[10px] capitalize text-neutral-500 mt-0.5">{acc.type} account</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-neutral-100">
                              {formatCurrency(acc.balance)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      No savings accounts linked yet.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        }

        return (
          <div 
            key={idx}
            className={`relative rounded-2xl bg-neutral-900 border border-neutral-850 p-6 overflow-hidden flex flex-col justify-between shadow-lg`}
          >
            {/* Top glass reflection and subtle gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient} opacity-50`} />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{item.title}</span>
                <span className="text-2xl font-extrabold text-neutral-100 tracking-tight">{item.value}</span>
              </div>
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center gap-1.5 text-xs text-neutral-500">
              {item.changeType === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
              {item.changeType === 'down' && <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
              <span className={
                item.changeType === 'up' 
                  ? 'text-emerald-600 font-semibold' 
                  : item.changeType === 'down' 
                    ? 'text-rose-600 font-semibold' 
                    : 'text-neutral-500'
              }>
                {item.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
