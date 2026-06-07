"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFinanceStore } from '@/hooks/use-finance-store';
import Sidebar from '@/components/sidebar';
import ProductTour from '@/components/dashboard/product-tour';
import { HelpCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, fetchUser, fetchData, isTourActive } = useFinanceStore();
  const router = useRouter();

  useEffect(() => {
    // Verify session
    fetchUser().then((currentUser) => {
      if (!currentUser) {
        // Redirect to login if no session cookie or local storage user is present
        router.push('/');
      } else if (currentUser.onboarded === false) {
        // Redirect to onboarding if profile onboarding is incomplete
        router.push('/onboarding');
      } else {
        // Load database stores
        fetchData();
      }
    });
  }, [fetchUser, fetchData, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 font-sans">
        <div className="relative flex flex-col items-center gap-4">
          {/* Glowing loader */}
          <div className="absolute h-24 w-24 rounded-full bg-indigo-200/30 blur-xl animate-pulse" />
          <div className="h-14 w-14 rounded-2xl overflow-hidden animate-bounce shadow-xl flex items-center justify-center">
            <Image src="/vyse-logo.jpeg" alt="Vyse Logo" width={58} height={58} className="h-[58px] w-[58px] min-w-[58px] object-cover" priority />
          </div>
          <span className="text-neutral-500 text-sm font-medium tracking-wide animate-pulse">
            Configuring secure connection...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-neutral-950 flex flex-col relative pt-16 md:pt-0">
        {/* Subtle top/side gradient blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-200/25 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-200/25 blur-[130px] pointer-events-none" />
        
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
        <ProductTour />

        {/* Floating Help / Restart Product Tour Button in the corner */}
        {!isTourActive && (
          <button
            onClick={() => {
              localStorage.setItem('vyse_tour_active', 'true');
              localStorage.setItem('vyse_tour_step', '-1');
              window.dispatchEvent(new Event('vyse_start_tour'));
              router.push('/dashboard');
            }}
            className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-95 text-neutral-400 hover:text-neutral-200 flex items-center justify-center cursor-pointer transition-all duration-150 shadow-lg z-40 group"
            title="Restart Product Tour"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="absolute right-12 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
              Restart Tour
            </span>
          </button>
        )}
      </main>
    </div>
  );
}
