"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { useConfirm } from '@/components/ui/confirmation-provider';
import { 
  LayoutDashboard, 
  Receipt, 
  CalendarDays, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
  Menu,
  X,
  Wallet,
  ChevronDown,
  UserCog,
  Key,
  Palette,
  HelpCircle,
  Compass,
  Globe
} from 'lucide-react';
import { HandDollar } from '@/components/ui/hand-dollar';
import { Dialog } from '@/components/ui/dialog';
import AccountDetailsModal from './dashboard/account-details-modal';
import PasswordChangeModal from './dashboard/password-change-modal';
import AppearanceSettingsModal, { applyTheme, ThemeMode } from './dashboard/appearance-settings-modal';
import SupportModal from './dashboard/support-modal';
import IntegrationsModal from './dashboard/integrations-modal';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useFinanceStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const confirm = useConfirm();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const handleRestartTour = () => {
    setShowProfileMenu(false);
    localStorage.setItem('vyse_tour_active', 'true');
    localStorage.setItem('vyse_tour_step', '-1');
    window.dispatchEvent(new Event('vyse_start_tour'));
    router.push('/dashboard');
  };

  // Load and apply theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('vyse_theme') || 'system') as ThemeMode;
      applyTheme(savedTheme);
    }
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Sign Out',
      message: 'Are you sure you want to sign out of your Vyse workspace session?',
      confirmText: 'Sign Out',
      type: 'danger'
    });
    if (!confirmed) return;

    await logout();
    router.push('/');
  };



  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
    { name: 'Recurring Bills', href: '/dashboard/bills', icon: CalendarDays },
    { name: 'Loans Tracker', href: '/dashboard/loans', icon: HandDollar },
    { name: 'Linked Accounts', href: '/dashboard/accounts', icon: Wallet },
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


          <div className="relative flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-neutral-850/50">
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  onClick={() => { setAccountOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-all cursor-pointer text-left"
                >
                  <UserCog className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Account</span>
                </button>
                {user && (
                  <button
                    onClick={() => { setPasswordOpen(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-all cursor-pointer text-left"
                  >
                    <Key className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Password</span>
                  </button>
                )}
                <button
                  onClick={() => { setAppearanceOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-all cursor-pointer text-left"
                >
                  <Palette className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Appearance</span>
                </button>
                <button
                  onClick={() => { setSupportOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-855 transition-all cursor-pointer text-left"
                >
                  <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Support</span>
                </button>
                <button
                  onClick={() => { setIntegrationsOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-all cursor-pointer text-left"
                >
                  <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Integrations</span>
                </button>
                <button
                  onClick={handleRestartTour}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-all cursor-pointer text-left border-t border-neutral-850/50 pt-2 mt-1"
                >
                  <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Product Tour</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 min-w-0">
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
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-1 rounded-md text-neutral-500 hover:text-neutral-350 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 animate-pulse"
                title="Profile Settings"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="h-5 w-[1px] bg-neutral-850 self-center mx-1" />
            
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

      <aside 
        className={`hidden md:flex h-screen bg-neutral-900 border-r border-neutral-850 flex-col justify-between transition-all duration-300 relative z-20 text-neutral-200 shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setShowProfileMenu(false);
          }}
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
          <nav id="tour-sidebar" className="px-3 py-4 flex flex-col gap-1">
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
          {/* Product Tour Button */}




          {/* User Card */}
          <div className={`relative flex items-center justify-between p-2 rounded-xl bg-neutral-950/40 border border-neutral-850/50 ${collapsed ? 'flex-col gap-3 justify-center' : ''}`}>
            {showProfileMenu && !collapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  onClick={() => { setAccountOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left"
                >
                  <UserCog className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Account</span>
                </button>
                {user && (
                  <button
                    onClick={() => { setPasswordOpen(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left"
                  >
                    <Key className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Password</span>
                  </button>
                )}
                <button
                  onClick={() => { setAppearanceOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left"
                >
                  <Palette className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Appearance</span>
                </button>
                <button
                  onClick={() => { setSupportOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left"
                >
                  <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Support</span>
                </button>
                <button
                  onClick={() => { setIntegrationsOpen(true); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left"
                >
                  <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Integrations</span>
                </button>
                <button
                  onClick={handleRestartTour}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer text-left border-t border-neutral-850/50 pt-2 mt-1"
                >
                  <Compass className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>Product Tour</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 min-w-0">
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex flex-col min-w-0 max-w-[120px]">
                    <span className="text-xs font-semibold text-neutral-200 truncate">{user?.full_name || 'Loading user...'}</span>
                    <span className="text-[10px] text-neutral-500 truncate">{user?.email || 'demo@finance.io'}</span>
                  </div>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-1 rounded-md text-neutral-500 hover:text-neutral-350 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 animate-pulse"
                    title="Profile Settings"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            
            <div className={collapsed ? "w-6 h-[1px] bg-neutral-850 my-1 self-center" : "h-5 w-[1px] bg-neutral-850 mx-1 self-center"} />
            
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

      {/* Settings Dialog Modals */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <AccountDetailsModal onSuccess={() => setAccountOpen(false)} />
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <PasswordChangeModal onSuccess={() => setPasswordOpen(false)} />
      </Dialog>

      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <AppearanceSettingsModal onSuccess={() => setAppearanceOpen(false)} />
      </Dialog>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <SupportModal onSuccess={() => setSupportOpen(false)} />
      </Dialog>

      <Dialog open={integrationsOpen} onOpenChange={setIntegrationsOpen}>
        <IntegrationsModal onSuccess={() => setIntegrationsOpen(false)} />
      </Dialog>
    </>
  );
}
