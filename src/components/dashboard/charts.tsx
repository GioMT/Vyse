"use client";

import React, { useEffect, useState } from 'react';
import { Transaction, Category } from '@/lib/db-mock';
import { CATEGORY_HEX_COLORS } from '@/lib/constants';
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
      <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-neutral-500 mb-1">{payload[0].payload.label}</p>
        <p className="text-sm font-semibold text-emerald-600">
          Inflow: ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-sm font-semibold text-rose-600">
          Outflow: ${payload[1].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const CustomDonutTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-neutral-100 mb-0.5">{payload[0].name}</p>
        <p className="text-sm font-extrabold" style={{ color: payload[0].payload.color }}>
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

  // Find last 7 days range if small, else sort chronologically
  filteredTransactions.forEach(tx => {
    const dateStr = tx.date; // YYYY-MM-DD
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
        const d = new Date(date + 'T00:00:00');
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
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

  // --- 2. Prepare Donut Chart Data (Expense breakdown by category) ---
  const expenseByCategory: { [catId: string]: number } = {};
  filteredTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      if (!expenseByCategory[tx.category_id]) {
        expenseByCategory[tx.category_id] = 0;
      }
      expenseByCategory[tx.category_id] += tx.amount;
    });



  const donutData = Object.entries(expenseByCategory).map(([catId, amount]) => {
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
  const hasDonutData = donutData.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Income vs Expenses Column */}
      <div className="lg:col-span-2 rounded-2xl bg-neutral-900 border border-neutral-850 p-6 flex flex-col justify-between shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-neutral-100">Income vs Expenses</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Visualizing cash inflows against outflows</p>
        </div>

        <div className="h-64 mt-6 w-full flex items-center justify-center">
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
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--color-neutral-850)', opacity: 0.3 }} />
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
      <div className="rounded-2xl bg-neutral-900 border border-neutral-850 p-6 flex flex-col justify-between shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-neutral-100">Category Distributions</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Where your expenses are going</p>
        </div>

        <div className="h-64 mt-6 w-full flex items-center justify-center relative">
          {hasDonutData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Circle metrics summaries */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">Total Outflow</span>
                <span className="text-xl font-extrabold text-neutral-100">
                  ${donutData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-neutral-500 flex flex-col gap-1 items-center justify-center">
              <span>No expense records.</span>
              <span className="text-[10px] text-neutral-600">Add an expense transaction to populate.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
