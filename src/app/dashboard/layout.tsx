"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFinanceStore } from '@/hooks/use-finance-store';
import Sidebar from '@/components/sidebar';
import ProductTour from '@/components/dashboard/product-tour';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, fetchUser, fetchData } = useFinanceStore();
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);
  const [renderPreloader, setRenderPreloader] = useState(true);

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

  useEffect(() => {
    // Once loading completes and the user session is verified, trigger smooth fade out
    if (!loading && user) {
      const fadeTimeout = setTimeout(() => {
        setFadeOut(true);
        const removeTimeout = setTimeout(() => {
          setRenderPreloader(false);
        }, 700); // matches the duration-700 CSS transition
        return () => clearTimeout(removeTimeout);
      }, 400); // 400ms delay to allow underlying content layout rendering
      return () => clearTimeout(fadeTimeout);
    }
  }, [loading, user]);

  // If we're not loading and there's no user session, let useEffect redirect to landing page
  if (!loading && !user) {
    return null;
  }

  // Preloader active while fetching details, or during the fade-out phase
  const showPreloader = renderPreloader || loading || !user;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans relative">
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
        <React.Suspense fallback={null}>
          <ProductTour />
        </React.Suspense>
      </main>

      {/* Premium Fluid Preloader Screen Overlay */}
      {showPreloader && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          <div className="relative flex flex-col items-center gap-6 select-none">
            {/* Glowing background halo */}
            <div className="absolute h-36 w-36 rounded-full bg-indigo-500/20 blur-[50px] animate-pulse" />
            
            {/* Bounce & Scale logo container */}
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/80 flex items-center justify-center bg-neutral-900/60 backdrop-blur-md">
              <Image 
                src="/vyse-logo.jpeg" 
                alt="Vyse Logo" 
                width={64} 
                height={64} 
                className="h-[64px] w-[64px] object-cover" 
                priority 
              />
            </div>
            
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-neutral-200 text-sm font-extrabold tracking-wider uppercase">
                Vyse Workspace
              </span>
              <span className="text-neutral-500 text-xs font-medium tracking-wide animate-pulse">
                Decrypting session databases...
              </span>
            </div>

            {/* Micro loading progress line */}
            <div className="w-32 h-[2px] bg-neutral-900 overflow-hidden relative rounded-full mt-1">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
