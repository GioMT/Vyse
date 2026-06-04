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
  DollarSign 
} from 'lucide-react';

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

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : '0';



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
    },
    {
      title: 'Net Savings Flow',
      value: formatCurrency(netSavings),
      change: `${savingsRate}% savings rate`,
      changeType: netSavings >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: netSavings >= 0 ? 'text-teal-600 bg-teal-500/10 border-teal-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      gradient: netSavings >= 0 ? 'from-teal-600/10 to-transparent' : 'from-amber-600/10 to-transparent'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
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
