"use client";

import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AccountForm from '@/components/dashboard/account-form';
import { formatCurrency } from '@/lib/format';
import { Plus, Coins, Wallet, Edit2, Eye, EyeOff } from 'lucide-react';
import { Account, deobfuscate } from '@/lib/db-mock';

interface CardProps {
  name: string;
  type: string;
  balance: number;
  color: string;
  id: string;
  userName: string;
  accountNumber?: string;
  onEdit: () => void;
}

const maskAccountNumber = (num: string): string => {
  if (num.length <= 4) return num;
  return '*'.repeat(num.length - 4) + num.slice(-4);
};

export const ATMCard = ({ name, type, balance, color, id, userName, accountNumber, onEdit }: CardProps) => {
  const [showFullNumber, setShowFullNumber] = useState(false);
  
  const getGradient = (col: string) => {
    switch (col) {
      case 'blue': return 'from-blue-600 via-indigo-650 to-indigo-850';
      case 'emerald': return 'from-emerald-600 via-teal-650 to-teal-850';
      case 'amber': return 'from-amber-500 via-orange-550 to-orange-700';
      case 'rose': return 'from-rose-600 via-red-650 to-red-850';
      case 'purple': return 'from-purple-600 via-violet-650 to-violet-850';
      case 'zinc': return 'from-zinc-700 via-neutral-750 to-neutral-900';
      default: return 'from-indigo-600 to-indigo-850';
    }
  };

  // Generate a mock card number based on the ID hash/length
  const last4 = id.slice(-4).padEnd(4, '0').toUpperCase();
  const defaultCardNumber = `4128  8592  0348  ${last4}`;

  const decryptedNum = accountNumber ? deobfuscate(accountNumber) : '';
  const displayCardNumber = decryptedNum 
    ? (showFullNumber ? decryptedNum : maskAccountNumber(decryptedNum))
    : defaultCardNumber;

  return (
    <div className={`relative h-48 w-full rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg shadow-black/25 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35 select-none bg-gradient-to-br ${getGradient(color)} border border-white/10 group`}>
      {/* Background visual graphics */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full border border-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      
      {/* Small hover-only edit button in the top-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md z-30"
        title="Edit Account"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>

      {/* Top Row: Card Issuer & Chip */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-white/70 block">Vyse Finance</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-white/50 block mt-0.5">{name}</span>
        </div>
        {/* Golden Metallic Chip */}
        <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border border-amber-500/30 flex flex-col justify-between p-1.5 shadow-md shadow-black/10 shrink-0">
          <div className="flex justify-between w-full h-px bg-yellow-900/10" />
          <div className="flex justify-between w-full h-px bg-yellow-900/10" />
        </div>
      </div>

      {/* Middle Row: Balance display */}
      <div className="z-10 mt-1">
        <span className="text-[9px] uppercase tracking-wider text-white/60 block font-semibold">Available Balance</span>
        <h4 className="text-xl md:text-2xl font-extrabold tracking-tight mt-0.5">
          {formatCurrency(balance)}
        </h4>
      </div>

      {/* Bottom Row: Card Details & Network Logo */}
      <div className="flex items-end justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-2 relative z-30">
            <span className="text-[10px] font-mono tracking-widest text-white/90 block leading-none">{displayCardNumber}</span>
            {decryptedNum && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullNumber(!showFullNumber);
                }}
                className="text-white/60 hover:text-white transition-colors cursor-pointer p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-white/30"
                title={showFullNumber ? "Hide Account Number" : "Show Account Number"}
              >
                {showFullNumber ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[8px] uppercase text-white/40 block leading-none font-semibold">Card Holder</span>
              <span className="text-[10px] uppercase font-bold text-white/80 mt-0.5 block tracking-wide">{userName}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase text-white/40 block leading-none font-semibold">Type</span>
              <span className="text-[10px] uppercase font-bold text-white/80 mt-0.5 block tracking-wide">{type}</span>
            </div>
          </div>
        </div>
        
        {/* Visa/Mastercard style network logo */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center">
            <span className="text-sm font-extrabold italic tracking-tight text-white select-none">VYSE</span>
            <span className="text-xs font-bold text-indigo-300 select-none">.</span>
          </div>
          <span className="text-[7px] uppercase tracking-widest text-white/40 font-bold block mt-0.5">PREMIUM</span>
        </div>
      </div>
    </div>
  );
};

export const PaperBill = ({ name, balance, onEdit }: Omit<CardProps, 'userName' | 'color' | 'type'>) => {
  return (
    <div className="relative h-48 w-full rounded-2xl p-4 flex flex-col justify-between border-4 border-emerald-950/60 bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-950 text-emerald-400 shadow-lg shadow-black/25 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35 select-none group">
      {/* Banknote visual texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_75%)] pointer-events-none" />
      
      {/* Inner banknote double border frame */}
      <div className="absolute inset-1.5 border border-dashed border-emerald-800/40 rounded-lg pointer-events-none" />
      <div className="absolute inset-2.5 border border-emerald-800/20 rounded-md pointer-events-none" />
      
      {/* Small hover-only edit button in the top-right corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 flex items-center justify-center border border-emerald-500/20 backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md z-30"
        title="Edit Note"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>

      {/* Top Banner: headers */}
      <div className="flex flex-col items-center text-center z-10 w-full relative">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 mt-1 leading-none">Vyse  Smart Financial Tracking</span>
        <span className="text-[8px] uppercase tracking-widest text-emerald-600 mt-1.5 leading-none font-bold">{name}</span>
      </div>

      {/* Middle Row: Portrait seal Watermark & Large Balance */}
      <div className="flex items-center justify-between z-10 w-full px-4">
        {/* Left Side Circular Seal */}
        <div className="h-10 w-10 rounded-full border border-emerald-800/30 bg-emerald-900/5 flex items-center justify-center relative shrink-0">
          <div className="absolute inset-0.5 border border-dashed border-emerald-800/20 rounded-full" />
          <span className="text-xs font-bold text-emerald-500/70">V</span>
        </div>

        {/* Center: Main Denomination Display */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[8px] uppercase tracking-wider text-emerald-600/70 font-semibold leading-none">Cash Balance</span>
          <h4 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-400 mt-1 select-all">
            {formatCurrency(balance)}
          </h4>
        </div>

        {/* Right Side Bank seal */}
        <div className="h-10 w-10 rounded-full border border-emerald-800/30 bg-emerald-900/5 flex items-center justify-center shrink-0">
          <Coins className="h-4.5 w-4.5 text-emerald-500/60" />
        </div>
      </div>

      {/* Bottom Row is kept blank to ensure the clean aesthetic requested */}
      <div className="h-4 z-10 w-full" />
    </div>
  );
};

export default function LinkedAccountsPage() {
  const { user, accounts } = useFinanceStore();
  const [accDialogOpen, setAccDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
  }, []);

  // Programmatic event listener to open/close account modal during product tour
  useEffect(() => {
    const handleOpen = () => {
      setEditingAccount(null);
      setAccDialogOpen(true);
    };
    const handleClose = () => {
      setEditingAccount(null);
      setAccDialogOpen(false);
    };
    window.addEventListener('vyse_open_add_account', handleOpen);
    window.addEventListener('vyse_close_add_account', handleClose);
    return () => {
      window.removeEventListener('vyse_open_add_account', handleOpen);
      window.removeEventListener('vyse_close_add_account', handleClose);
    };
  }, []);

  const handleEditClick = (acc: Account) => {
    setEditingAccount(acc);
    setAccDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingAccount(null);
    setAccDialogOpen(true);
  };

  if (!mounted) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Linked Accounts</h1>
            <p className="text-xs text-neutral-555 mt-1">Manage checking, savings, physical cash, and credit card portfolio assets.</p>
          </div>
        </div>
        <div className="h-40 w-full rounded-xl bg-neutral-900 border border-neutral-850/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">Linked Accounts</h1>
          <p className="text-xs text-neutral-550 mt-1">Manage checking, savings, physical cash, and credit card portfolio assets.</p>
        </div>

        {/* Add/Edit Account Dialog */}
        <Dialog open={accDialogOpen} onOpenChange={(open) => {
          setAccDialogOpen(open);
          if (!open) {
            setEditingAccount(null);
          }
        }}>
          <DialogTrigger
            render={
              <button 
                id="tour-add-account"
                onClick={handleAddClick}
                className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Account</span>
              </button>
            }
          />
          <AccountForm account={editingAccount || undefined} onSuccess={() => setAccDialogOpen(false)} />
        </Dialog>
      </div>

      {/* Visual accounts Grid */}
      <div id="tour-accounts-grid">
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              if (acc.type === 'cash') {
                return (
                  <PaperBill
                    key={acc.id}
                    id={acc.id}
                    name={acc.name}
                    balance={acc.balance}
                    accountNumber={acc.account_number}
                    onEdit={() => handleEditClick(acc)}
                  />
                );
              } else {
                return (
                  <ATMCard
                    key={acc.id}
                    id={acc.id}
                    name={acc.name}
                    type={acc.type}
                    balance={acc.balance}
                    color={acc.color}
                    userName={user?.full_name || 'Alex Mercer'}
                    accountNumber={acc.account_number}
                    onEdit={() => handleEditClick(acc)}
                  />
                );
              }
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-850 bg-neutral-900/10 p-12 text-center flex flex-col gap-1 items-center justify-center max-w-lg mx-auto mt-12">
            <Wallet className="h-8 w-8 text-neutral-550 mb-2" />
            <h4 className="font-bold text-neutral-100 text-sm">No accounts found</h4>
            <p className="text-xs text-neutral-500">Add credit cards, savings, checking accounts, or physical cash notes to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
