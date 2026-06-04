"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { isDemoMode } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Receipt, 
  CalendarDays, 
  PiggyBank, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  User,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, fetchData } = useFinanceStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoMode = isDemoMode();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all mock data to defaults?')) {
      if (typeof window !== 'undefined' && user) {
        localStorage.removeItem(`pt_accounts_${user.id}`);
        localStorage.removeItem(`pt_transactions_${user.id}`);
        localStorage.removeItem(`pt_bills_${user.id}`);
        localStorage.removeItem(`pt_loans_${user.id}`);
        fetchData(); // reload
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
    { name: 'Recurring Bills', href: '/dashboard/bills', icon: CalendarDays },
    { name: 'Loans Tracker', href: '/dashboard/loans', icon: PiggyBank },
  ];

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-neutral-900 border-b border-neutral-850 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shadow-indigo-500/10 shrink-0 flex items-center justify-center">
            <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={38} height={38} className="h-[38px] w-[38px] min-w-[38px] object-cover" />
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            VYSE<span className="text-indigo-400 font-medium">.</span>
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="h-9 w-9 rounded-lg border border-neutral-850 bg-neutral-950 text-neutral-400 hover:text-neutral-100 flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150"
          aria-label="Open menu drawer"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Navigation Drawer Backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer Menu Panel */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-neutral-900 border-r border-neutral-850 p-6 flex flex-col justify-between z-50 transition-transform duration-350 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={38} height={38} className="h-[38px] w-[38px] min-w-[38px] object-cover" />
              </div>
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                VYSE<span className="text-indigo-400 font-medium">.</span>
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 rounded-lg border border-neutral-850 text-neutral-400 hover:text-neutral-100 flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
              aria-label="Close menu drawer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10' 
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4">
          {demoMode && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleResetData();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 border border-dashed border-amber-500/20 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Workspace</span>
            </button>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-850/50">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="h-8.5 w-8.5 rounded-full object-cover border border-neutral-800"
                />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-indigo-400" />
                </div>
              )}
              <div className="flex flex-col min-w-0 max-w-[120px]">
                <span className="text-xs font-semibold text-neutral-200 truncate">{user?.full_name || 'Loading user...'}</span>
                <span className="text-[10px] text-neutral-500 truncate">{user?.email || 'demo@finance.io'}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          <span className="text-[9px] text-neutral-600 text-center tracking-wide">
            A product of Valk Horizon Ventures
          </span>
        </div>
      </div>

      {/* Desktop Sidebar (visible on medium screens and up) */}
      <aside 
        className={`hidden md:flex h-screen bg-neutral-900 border-r border-neutral-850 flex-col justify-between transition-all duration-300 relative z-20 text-neutral-200 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-[-14px] top-8 h-7 w-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-100 cursor-pointer transition-colors active:scale-95"
        >
          {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>

        {/* Top Section: App Brand */}
        <div>
          <div className={`p-6 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/10 shrink-0 flex items-center justify-center">
              <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={43} height={43} className="h-[43px] w-[43px] min-w-[43px] object-cover" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                VYSE<span className="text-indigo-400 font-medium">.</span>
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10' 
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {collapsed && (
                    <div className="absolute left-16 bg-neutral-950 border border-neutral-850 px-2 py-1.5 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Profile & Reset actions */}
        <div className="p-3 border-t border-neutral-850 flex flex-col gap-2">
          {/* Reset Mock Data Button (Only in Demo Mode) */}
          {!collapsed && demoMode && (
            <button
              onClick={handleResetData}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 border border-dashed border-amber-500/20 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Workspace</span>
            </button>
          )}
          {collapsed && demoMode && (
            <button
              onClick={handleResetData}
              className="flex items-center justify-center p-2 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 cursor-pointer relative group"
            >
              <RefreshCw className="h-4.5 w-4.5" />
              <div className="absolute left-16 bg-neutral-950 border border-neutral-850 px-2 py-1.5 rounded-lg text-xs font-medium text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                Reset Demo Workspace
              </div>
            </button>
          )}

          {/* User Card */}
          <div className={`flex items-center justify-between p-2 rounded-xl bg-neutral-950/40 border border-neutral-850/50 ${collapsed ? 'flex-col gap-3 justify-center' : ''}`}>
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="h-8.5 w-8.5 rounded-full object-cover border border-neutral-800"
                />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-indigo-400" />
                </div>
              )}
              {!collapsed && (
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <span className="text-xs font-semibold text-neutral-200 truncate">{user?.full_name || 'Loading user...'}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{user?.email || 'demo@finance.io'}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer transition-colors active:scale-95 ${collapsed ? 'mt-1' : ''}`}
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Parent Company Label */}
          {!collapsed && (
            <span className="text-[9px] text-neutral-600 text-center block mt-1 tracking-wide">
              A product of Valk Horizon Ventures
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
