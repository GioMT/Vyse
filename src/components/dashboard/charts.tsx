"use client";

import React, { useEffect, useState } from 'react';
import { Transaction, Category } from '@/lib/db-mock';
import { CATEGORY_HEX_COLORS } from '@/lib/constants';
import { formatCurrency, getCurrencySymbol } from '@/lib/format';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface ChartsProps {
  filteredTransactions: Transaction[];
  categories: Category[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload: {
      label?: string;
      color?: string;
    };
  }>;
}

const CustomBarTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-neutral-850 p-3 rounded-xl shadow-2xl z-50">
        <p className="text-xs font-semibold text-neutral-500 mb-1">{payload[0].payload.label}</p>
        <p className="text-sm font-semibold text-emerald-600">
          Inflow: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm font-semibold text-rose-600">
          Outflow: {formatCurrency(payload[1].value)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomDonutTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-neutral-850 p-3 rounded-xl shadow-2xl z-50">
        <p className="text-xs font-semibold text-neutral-100 mb-0.5">{payload[0].name}</p>
        <p className="text-sm font-extrabold" style={{ color: payload[0].payload.color }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Charts({ filteredTransactions, categories }: ChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-neutral-900/60 border border-neutral-850 animate-pulse" />
        <div className="h-80 rounded-2xl bg-neutral-900/60 border border-neutral-850 animate-pulse" />
      </div>
    );
  }

  // --- 1. Prepare Bar Chart Data (Inflows vs Outflows over time) ---
  // Group transactions by date
  const txByDate: { [date: string]: { income: number; expense: number } } = {};

  filteredTransactions.forEach(tx => {
    // Extract date portion YYYY-MM-DD if date has time component (e.g. from getPastDate)
    const dateStr = tx.date.split('T')[0];
    if (!txByDate[dateStr]) {
      txByDate[dateStr] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      txByDate[dateStr].income += tx.amount;
    } else {
      txByDate[dateStr].expense += tx.amount;
    }
  });

  const barData = Object.entries(txByDate)
    .map(([date, val]) => {
      // Format YYYY-MM-DD to Mon DD
      let label = date;
      try {
        const d = new Date(date + 'T00:00:00Z');
        if (!isNaN(d.getTime())) {
          label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        }
      } catch {
        // Fallback
      }
      return {
        date,
        label,
        Income: parseFloat(val.income.toFixed(2)),
        Expense: parseFloat(val.expense.toFixed(2))
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- 2. Prepare Donut Chart Data (Inflow and Outflow breakdown by category) ---
  const incomeByCategory: { [catId: string]: number } = {};
  filteredTransactions
    .filter(tx => tx.type === 'income')
    .forEach(tx => {
      if (!incomeByCategory[tx.category_id]) {
        incomeByCategory[tx.category_id] = 0;
      }
      incomeByCategory[tx.category_id] += tx.amount;
    });

  const inflowDonutData = Object.entries(incomeByCategory).map(([catId, amount]) => {
    const cat = categories.find(c => c.id === catId);
    const catName = cat ? cat.name : 'Other Income';
    const rawColor = cat ? cat.color : 'indigo';
    return {
      name: catName,
      value: parseFloat(amount.toFixed(2)),
      color: CATEGORY_HEX_COLORS[rawColor] || '#6366f1'
    };
  });

  const expenseByCategory: { [catId: string]: number } = {};
  filteredTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      if (!expenseByCategory[tx.category_id]) {
        expenseByCategory[tx.category_id] = 0;
      }
      expenseByCategory[tx.category_id] += tx.amount;
    });

  const outflowDonutData = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const cat = categories.find(c => c.id === catId);
    const catName = cat ? cat.name : 'Other Expense';
    const rawColor = cat ? cat.color : 'zinc';
    return {
      name: catName,
      value: parseFloat(amount.toFixed(2)),
      color: CATEGORY_HEX_COLORS[rawColor] || '#71717a'
    };
  });

  const hasBarData = barData.length > 0;
  const hasInflowDonutData = inflowDonutData.length > 0;
  const hasOutflowDonutData = outflowDonutData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Income vs Expenses Column */}
      <div className="lg:col-span-2 rounded-2xl bg-neutral-900 border border-neutral-850 p-6 flex flex-col shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-neutral-100">Income vs Expenses</h3>
          <p className="text-xs text-neutral-550 mt-0.5">Visualizing cash inflows against outflows</p>
        </div>

        <div className="flex-1 min-h-[300px] lg:min-h-[360px] mt-6 w-full flex items-center justify-center relative">
          {hasBarData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3decb" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#7a7065" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#7a7065" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${getCurrencySymbol()}${val.toLocaleString()}`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--color-neutral-850)', opacity: 0.3 }} wrapperStyle={{ zIndex: 50 }} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#7a7065' }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-xs text-neutral-500 flex flex-col gap-1 items-center justify-center">
              <span>No transaction history to display.</span>
              <span className="text-[10px] text-neutral-600">Add an inflow/outflow transaction to populate.</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Column */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-850 p-6 flex flex-col shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-neutral-100">Category Distributions</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Where your cash flow is allocated</p>
        </div>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-8 mt-6 w-full min-w-0 content-start">
          {/* Inflow Donut */}
          <div className="w-full flex flex-col items-center justify-start gap-4 min-w-0" style={{ minWidth: 0 }}>
            {hasInflowDonutData ? (
              <>
                {/* Donut Chart wrapper */}
                <div className="h-40 md:h-44 w-full relative flex items-center justify-center shrink-0 min-w-0" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} wrapperStyle={{ zIndex: 50 }} />
                      <Pie
                        data={inflowDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="90%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {inflowDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Inner Circle metrics summaries */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500">Inflow</span>
                    <span className="text-sm md:text-base font-extrabold text-neutral-100 mt-0.5">
                      {getCurrencySymbol()}{inflowDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full flex flex-col justify-start gap-1.5 text-[10px] md:text-[11px] font-semibold text-neutral-350 pr-1 select-none items-center">
                  <div className="flex flex-col items-start gap-1.5 w-full max-w-[160px] sm:max-w-[180px] mx-auto">
                    {inflowDonutData
                      .sort((a, b) => b.value - a.value) // Sort by highest value first
                      .map((item, index) => {
                        const total = inflowDonutData.reduce((sum, d) => sum + d.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={index} className="flex items-center justify-between w-full gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span 
                                className="h-1.5 w-1.5 rounded-full shrink-0" 
                                style={{ backgroundColor: item.color }} 
                              />
                              <span className="truncate text-neutral-400 font-medium" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-neutral-100 font-bold shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full text-center text-[10px] text-neutral-550 flex flex-col gap-1 items-center justify-center p-2">
                <span>No income records.</span>
              </div>
            )}
          </div>
 
          {/* Outflow Donut */}
          <div className="w-full flex flex-col items-center justify-start gap-4 min-w-0" style={{ minWidth: 0 }}>
            {hasOutflowDonutData ? (
              <>
                {/* Donut Chart wrapper */}
                <div className="h-40 md:h-44 w-full relative flex items-center justify-center shrink-0 min-w-0" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomDonutTooltip />} wrapperStyle={{ zIndex: 50 }} />
                      <Pie
                        data={outflowDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="90%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {outflowDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Inner Circle metrics summaries */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500">Outflow</span>
                    <span className="text-sm md:text-base font-extrabold text-neutral-100 mt-0.5">
                      {getCurrencySymbol()}{outflowDonutData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full flex flex-col justify-start gap-1.5 text-[10px] md:text-[11px] font-semibold text-neutral-350 pr-1 select-none items-center">
                  <div className="flex flex-col items-start gap-1.5 w-full max-w-[160px] sm:max-w-[180px] mx-auto">
                    {outflowDonutData
                      .sort((a, b) => b.value - a.value) // Sort by highest value first
                      .map((item, index) => {
                        const total = outflowDonutData.reduce((sum, d) => sum + d.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={index} className="flex items-center justify-between w-full gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span 
                                className="h-1.5 w-1.5 rounded-full shrink-0" 
                                style={{ backgroundColor: item.color }} 
                              />
                              <span className="truncate text-neutral-400 font-medium" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-neutral-100 font-bold shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full text-center text-[10px] text-neutral-550 flex flex-col gap-1 items-center justify-center p-2">
                <span>No expense records.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
