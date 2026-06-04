"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFinanceStore } from '@/hooks/use-finance-store';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, fetchUser, fetchData } = useFinanceStore();
  const router = useRouter();

  useEffect(() => {
    // Verify session
    fetchUser().then((currentUser) => {
      if (!currentUser) {
        // Redirect to login if no session cookie or local storage user is present
        router.push('/');
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
      </main>
    </div>
  );
}
