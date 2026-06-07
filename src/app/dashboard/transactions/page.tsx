"use client";

import React, { useState } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import TransactionForm from '@/components/dashboard/transaction-form';
import { CATEGORY_COLOR_CLASSES } from '@/lib/constants';
import { 
  Search, 
  Download, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  FilterX,
  Sparkles,
  Wand2
} from 'lucide-react';
import { parseDescription } from '@/lib/format';
import { useConfirm } from '@/components/ui/confirmation-provider';

export default function TransactionsPage() {
  const { 
    accounts, 
    categories, 
    transactions, 
    deleteTransaction,
    categorizeWithAI
  } = useFinanceStore();

  const confirm = useConfirm();

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [accFilter, setAccFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredTxs = transactions.filter(tx => {
    const { cleanDesc } = parseDescription(tx.description);
    const matchesSearch = cleanDesc.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCat = catFilter === 'all' || tx.category_id === catFilter;
    const matchesAcc = accFilter === 'all' || tx.account_id === accFilter;
    return matchesSearch && matchesType && matchesCat && matchesAcc;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTxs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCatFilter('all');
    setAccFilter('all');
    setCurrentPage(1);
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    const headers = 'Date,Description,Type,Category,Account,Amount\n';
    const rows = filteredTxs.map(tx => {
      const { cleanDesc } = parseDescription(tx.description);
      const cat = categories.find(c => c.id === tx.category_id)?.name || 'Uncategorized';
      const acc = accounts.find(a => a.id === tx.account_id)?.name || 'Unknown';
      return `"${tx.date}","${cleanDesc.replace(/"/g, '""')}","${tx.type}","${cat}","${acc}",${tx.amount}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vyse_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Transaction Ledger</h1>
          <p className="text-xs text-neutral-500 mt-1">Review, search, and manage your complete historical transactions.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            disabled={filteredTxs.length === 0}
            className="h-9 px-3.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 active:scale-95 border border-neutral-850 text-neutral-100 text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            title="Export filtered transactions to CSV sheet"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          {/* Add Transaction Dialog Button */}
          <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
            <DialogTrigger
              render={
                <button className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  <span>New Transaction</span>
                </button>
              }
            />
            <TransactionForm onSuccess={() => setTxDialogOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* Filters Dashboard Toolbar */}
      <div id="tour-transactions-filters" className="rounded-xl bg-neutral-900 border border-neutral-850 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="e.g. Whole Foods"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full pl-9 pr-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Transaction Type</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as 'all' | 'income' | 'expense'); setCurrentPage(1); }}
            className="h-9 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Types</option>
            <option value="income">Income (Inflows)</option>
            <option value="expense">Expense (Outflows)</option>
          </select>
        </div>

        {/* Account Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Source Account</label>
          <select
            value={accFilter}
            onChange={(e) => { setAccFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Category</label>
          <select
            value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 w-full px-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div>
          <button
            onClick={handleClearFilters}
            className="h-9 w-full rounded-lg bg-neutral-850 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FilterX className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Table Panel */}
      <div id="tour-transactions-table" className="rounded-2xl bg-neutral-900 border border-neutral-850 p-6 shadow-lg">
        <div className="overflow-x-auto">
          {currentItems.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-850 text-neutral-500 font-semibold uppercase tracking-wider pb-3">
                  <th className="py-3 hidden sm:table-cell">Date</th>
                  <th className="py-3">Description</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 hidden md:table-cell">Source Account</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850 text-neutral-300">
                {currentItems.map((tx) => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  const acc = accounts.find(a => a.id === tx.account_id);
                  const catColor = cat ? CATEGORY_COLOR_CLASSES[cat.color] : 'bg-neutral-800 text-neutral-400 border-neutral-700/50';
                  const { cleanDesc, fee } = parseDescription(tx.description);
                  const baseAmount = tx.amount - fee;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-850/20 transition-colors group">
                      <td className="py-4 text-neutral-400 hidden sm:table-cell">
                        {new Date(tx.date).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </td>
                      <td className="py-4 font-bold text-neutral-100 text-sm">{cleanDesc}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${catColor}`}>
                            {cat ? cat.name : 'Uncategorized'}
                          </span>
                          
                          {tx.ai_metadata?.is_ai_categorized ? (
                            <div className="group relative flex items-center shrink-0">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-xl bg-neutral-950/95 border border-neutral-850 text-[10px] text-neutral-400 shadow-2xl z-50 text-center leading-normal">
                                <span className="font-bold text-neutral-200 block mb-0.5">AI Cleaned Merchant</span>
                                &quot;{tx.ai_metadata.clean_merchant}&quot;
                                <span className="block mt-1 font-semibold text-indigo-400">Confidence: {Math.round((tx.ai_metadata.confidence ?? 0.9) * 100)}% via Gemini</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={async () => {
                                await categorizeWithAI(tx.id);
                              }}
                              className="p-1 rounded-md bg-neutral-950 border border-neutral-850 hover:border-indigo-500 hover:text-indigo-400 text-neutral-500 hover:bg-indigo-500/5 transition-all active:scale-95 cursor-pointer shrink-0"
                              title="Run Gemini AI categorization"
                            >
                              <Wand2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-neutral-400 font-medium hidden md:table-cell">{acc ? acc.name : 'Unknown Account'}</td>
                      <td className="py-4 text-right">
                        <div className={`text-sm font-extrabold ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}${baseAmount.toFixed(2)}
                        </div>
                        {fee > 0 && (
                          <div className="text-[10px] text-neutral-500 font-medium">
                            + ${fee.toFixed(2)} charge
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-right">
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
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150"
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
            <div className="text-center py-12 text-neutral-500 flex flex-col gap-1 items-center justify-center">
              <span>No transactions match the selected filters.</span>
              <span className="text-[10px] text-neutral-600">Try loosening your search terms or filters.</span>
            </div>
          )}
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-850 mt-6 pt-4 text-xs text-neutral-400">
            <span>
              Showing <span className="text-neutral-100 font-bold">{indexOfFirstItem + 1}</span> to{' '}
              <span className="text-neutral-100 font-bold">{Math.min(indexOfLastItem, filteredTxs.length)}</span> of{' '}
              <span className="text-neutral-100 font-bold">{filteredTxs.length}</span> entries
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              
              <div className="h-8 px-3 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-center font-bold text-neutral-100 text-[11px]">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
