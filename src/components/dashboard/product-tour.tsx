"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2
} from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  targetId: string;
  position: 'right' | 'left' | 'top' | 'bottom';
  path: string;
}

const TOUR_STEPS: TourStep[] = [
  // 1. Dashboard Page Steps
  {
    title: "Workspace Navigation",
    description: "Access all your portfolio views here: review accounts, pay recurring bills, track loans, or view your ledger logs.",
    targetId: "tour-sidebar",
    position: "right",
    path: "/dashboard"
  },
  {
    title: "Financial Metrics Overview",
    description: "Get real-time insights into your Net Worth, Net Cash Flow, total savings, and credit card liabilities.",
    targetId: "tour-stats",
    position: "bottom",
    path: "/dashboard"
  },
  {
    title: "Global Range Filter",
    description: "Filter all dashboard graphs, metrics, and summary data dynamically. Choose pre-set durations or define a custom calendar range.",
    targetId: "tour-range-filter",
    position: "bottom",
    path: "/dashboard"
  },
  {
    title: "Cash Flow Analytics",
    description: "Analyze monthly income versus expenses and see your category distributions visually in interactive charts.",
    targetId: "tour-charts",
    position: "bottom",
    path: "/dashboard"
  },
  {
    title: "Recent Transaction Ledger",
    description: "Review your latest financial activity. Click the trash icon on the right to delete transactions and instantly update balances.",
    targetId: "tour-transactions",
    position: "top",
    path: "/dashboard"
  },
  {
    title: "Add Transactions",
    description: "Record any new checking, savings, card transactions, or transfers instantly to keep your balance sheets accurate.",
    targetId: "tour-add-tx",
    position: "left",
    path: "/dashboard"
  },
  {
    title: "New Transaction Form",
    description: "Enter your ledger details here. Select whether this is an Expense, Income, or Transfer, select checking/savings accounts, set description, amount, and charge fees.",
    targetId: "tour-transaction-form",
    position: "right",
    path: "/dashboard"
  },
  // 2. Transactions Page Steps
  {
    title: "Advanced Filters",
    description: "Filter transactions by date, description, type, category, or source account to easily isolate specific cash flows.",
    targetId: "tour-transactions-filters",
    position: "bottom",
    path: "/dashboard/transactions"
  },
  {
    title: "Full Ledger Ledger",
    description: "View your complete historical transactions log here, with CSV export and paginated navigation.",
    targetId: "tour-transactions-table",
    position: "top",
    path: "/dashboard/transactions"
  },
  // 3. Recurring Bills Page Steps
  {
    title: "Bill Payout Metrics",
    description: "Track total scheduled bill volumes, see overdue counts, and see what bills are due in the next 7 days.",
    targetId: "tour-bills-summary",
    position: "bottom",
    path: "/dashboard/bills"
  },
  {
    title: "Schedule Bill Button",
    description: "Click this action button to open the bill manager scheduler dialog.",
    targetId: "tour-add-bill",
    position: "left",
    path: "/dashboard/bills"
  },
  {
    title: "Schedule Bill Form",
    description: "Set the subscription name, billing amount, category, cycle (weekly, monthly, yearly), next due date, and optional automatic simulated deductions.",
    targetId: "tour-bill-form",
    position: "right",
    path: "/dashboard/bills"
  },
  {
    title: "Schedule & Pay Invoices",
    description: "Monitor weekly, monthly, or yearly recurring subscriptions and pay invoices directly from your cash balances.",
    targetId: "tour-bills-list",
    position: "top",
    path: "/dashboard/bills"
  },
  // 4. Loans Tracker Page Steps
  {
    title: "Debt Load Overview",
    description: "Check your total outstanding debt, total payments made, and overall payoff percentage progress.",
    targetId: "tour-loans-aggregate",
    position: "bottom",
    path: "/dashboard/loans"
  },
  {
    title: "Track Loan Button",
    description: "Click this button to track a new liability debt principal balance.",
    targetId: "tour-add-loan",
    position: "left",
    path: "/dashboard/loans"
  },
  {
    title: "Track Loan Form",
    description: "Input the loan provider, interest terms, duration in months, payment amount, and due date. The amortization principal is tracked automatically.",
    targetId: "tour-loan-form",
    position: "right",
    path: "/dashboard/loans"
  },
  {
    title: "Active Liabilities",
    description: "Monitor amortization progress and next payment schedules for student loans, car loans, or mortgages.",
    targetId: "tour-loans-list",
    position: "top",
    path: "/dashboard/loans"
  },
  {
    title: "Debt Paydown Tool",
    description: "Apply additional payments or record late charges directly against your debt principal to pay off loans faster.",
    targetId: "tour-loans-tool",
    position: "left",
    path: "/dashboard/loans"
  },
  // 5. Linked Accounts Page Steps
  {
    title: "Add Account Button",
    description: "Click this button to configure and link a new checking, savings, credit card, or physical cash holdings note.",
    targetId: "tour-add-account",
    position: "left",
    path: "/dashboard/accounts"
  },
  {
    title: "Add Account Form",
    description: "Specify the account name, asset type, starting balance, security number, and assign a custom card color theme.",
    targetId: "tour-account-form",
    position: "right",
    path: "/dashboard/accounts"
  },
  {
    title: "Asset Portfolio Cards",
    description: "View checking and savings balances on custom debit/credit cards, and check your cash holdings on paper banknote designs.",
    targetId: "tour-accounts-grid",
    position: "top",
    path: "/dashboard/accounts"
  }
];

export default function ProductTour() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<-1 | number>(-1); // -1 = Welcome Modal, 0+ = Tour steps
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const setTourActive = useFinanceStore(state => state.setTourActive);
  const [isInitialTour, setIsInitialTour] = useState(false);

  // Sync isInitialTour status with localStorage when active status changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        setIsInitialTour(localStorage.getItem('vyse_initial_tour') === 'true');
      });
    }
  }, [isActive]);

  // Sync tour active state with global finance store
  useEffect(() => {
    Promise.resolve().then(() => {
      setTourActive(isActive);
    });
  }, [isActive, setTourActive]);

  // Detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const tourInitialized = useRef(false);

  // Listen for starting tour on mount or URL change
  useEffect(() => {
    if (tourInitialized.current) return;

    const tourParam = searchParams.get('tour');
    const tourActive = localStorage.getItem('vyse_tour_active');
    const savedStepStr = localStorage.getItem('vyse_tour_step');

    if (tourParam === 'true' || tourActive === 'true') {
      tourInitialized.current = true;
      
      Promise.resolve().then(() => {
        setIsActive(true);
        if (savedStepStr !== null) {
          const savedStep = parseInt(savedStepStr, 10);
          setCurrentStep(savedStep);
        } else {
          setCurrentStep(-1); // Start with Welcome Modal
        }
      });
      
      // Clean query parameter from URL safely
      const url = new URL(window.location.href);
      if (url.searchParams.has('tour')) {
        url.searchParams.delete('tour');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [searchParams]);

  // Listen for manual tour starts from sidebar
  useEffect(() => {
    const handleManualStart = () => {
      setIsActive(true);
      setCurrentStep(-1);
      setShowCompletion(false);
    };

    window.addEventListener('vyse_start_tour', handleManualStart);
    return () => {
      window.removeEventListener('vyse_start_tour', handleManualStart);
    };
  }, []);

  // Synchronize state with localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem('vyse_tour_active', 'true');
      localStorage.setItem('vyse_tour_step', currentStep.toString());
    } else {
      localStorage.removeItem('vyse_tour_active');
      localStorage.removeItem('vyse_tour_step');
    }
  }, [isActive, currentStep]);

  // Scroll target element into view ONCE when step changes or route changes (safely and non-disruptively)
  useEffect(() => {
    if (!isActive || currentStep < 0 || currentStep >= TOUR_STEPS.length || showCompletion) {
      return;
    }
    const step = TOUR_STEPS[currentStep];
    
    // Verify we are on the correct subpage before scrolling
    if (step.path !== pathname) {
      return;
    }

    // Never scroll the fixed/sticky sidebar navigation to prevent browser layout engine crashes
    if (step.targetId === 'tour-sidebar') {
      return;
    }

    const performScroll = () => {
      const element = document.getElementById(step.targetId);
      if (!element) return;

      const isHidden = element.offsetWidth === 0 && element.offsetHeight === 0;
      if (isHidden) return;

      // Find the main scrollable container
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        const containerRect = mainContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Calculate absolute top offset of element relative to main container's scroll area
        const elementOffsetTop = elementRect.top - containerRect.top + mainContainer.scrollTop;
        
        // Calculate scroll top to center the element
        const targetScrollTop = elementOffsetTop - (containerRect.height / 2) + (elementRect.height / 2);

        mainContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Run after a short delay to ensure page rendering settles
    const timer = setTimeout(performScroll, 150);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, showCompletion, pathname]);

  // Update target highlighting and tooltip position when coordinates or settings change
  useEffect(() => {
    let active = true;

    const updateStyles = (hStyle: React.CSSProperties | null, tStyle: React.CSSProperties | null) => {
      // Defer state updates to avoid setState-in-effect warning
      Promise.resolve().then(() => {
        if (!active) return;
        setHighlightStyle(hStyle);
        setTooltipStyle(tStyle);
      });
    };

    if (!isActive || currentStep < 0 || currentStep >= TOUR_STEPS.length || showCompletion) {
      updateStyles(null, null);
      return;
    }

    const step = TOUR_STEPS[currentStep];
    
    // Verify we are on the correct subpage before calculating coordinates
    if (step.path !== pathname) {
      updateStyles(null, null);
      return;
    }

    const calculatePositions = () => {
      const element = document.getElementById(step.targetId);
      if (!element) {
        // Fallback positioning if element not found
        updateStyles(null, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        });
        return;
      }

      const rect = element.getBoundingClientRect();
      const isElementHidden = rect.width === 0 || rect.height === 0;

      // Fallback for hidden elements (e.g. desktop sidebar on mobile)
      if (isElementHidden) {
        updateStyles(null, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        });
        return;
      }

      const padding = 8;

      let hTop = rect.top - padding;
      let hLeft = rect.left - padding;
      let hWidth = rect.width + padding * 2;
      let hHeight = rect.height + padding * 2;

      // Clamp to screen boundaries to keep highlighter border fully visible on screen
      if (hLeft < 4) {
        const offset = 4 - hLeft;
        hLeft = 4;
        hWidth = Math.max(0, hWidth - offset);
      }
      if (hTop < 4) {
        const offset = 4 - hTop;
        hTop = 4;
        hHeight = Math.max(0, hHeight - offset);
      }
      if (hLeft + hWidth > window.innerWidth - 4) {
        hWidth = window.innerWidth - 4 - hLeft;
      }
      if (hTop + hHeight > window.innerHeight - 4) {
        hHeight = window.innerHeight - 4 - hTop;
      }

      // Highlight coords (using fixed viewport positioning to ignore parent container offsets)
      const highlight: React.CSSProperties = {
        position: 'fixed',
        top: `${hTop}px`,
        left: `${hLeft}px`,
        width: `${hWidth}px`,
        height: `${hHeight}px`,
        zIndex: 9995
      };

      // Check if target is a centered modal dialog card to keep tooltip safely on the side
      const isModalStep = ['tour-transaction-form', 'tour-bill-form', 'tour-loan-form', 'tour-account-form'].includes(step.targetId);

      // Tooltip position calculations
      const tooltipWidth = isModalStep 
        ? Math.min(300, window.innerWidth - 32) 
        : (isMobile ? window.innerWidth - 32 : 320);
      const tooltipHeight = 170; // safe overestimate
      
      let preferredPos = step.position;
      
      // On mobile, force vertical placements except for centered modal form steps
      if (isMobile && !isModalStep) {
        preferredPos = rect.top > window.innerHeight / 2 ? 'top' : 'bottom';
      } else if (!isModalStep) {
        // Desktop dynamic viewport adjustments (only for non-modal steps)
        if (preferredPos === 'bottom' && rect.bottom + 16 + tooltipHeight > window.innerHeight) {
          // If not enough space below, flip to top if there is space there
          if (rect.top - 20 - tooltipHeight > 0) {
            preferredPos = 'top';
          }
        } else if (preferredPos === 'top' && rect.top - 20 - tooltipHeight < 0) {
          // If not enough space above, flip to bottom if there is space there
          if (rect.bottom + 16 + tooltipHeight < window.innerHeight) {
            preferredPos = 'bottom';
          }
        }
      }

      let top = 0;
      let left = 0;

      switch (preferredPos) {
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + 16;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - 16;
          break;
        case 'top':
          top = rect.top - tooltipHeight - 16;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
        default:
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
      }

      // Bound validation
      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (top < 16) top = 16;
      if (top + tooltipHeight > window.innerHeight - 16) {
        top = window.innerHeight - tooltipHeight - 16;
      }

      const tooltip: React.CSSProperties = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: isMobile ? 'calc(100vw - 32px)' : `${tooltipWidth}px`,
        zIndex: 9998
      };

      updateStyles(highlight, tooltip);
    };

    // Recalculate immediately and at multiple intervals to capture smooth scrolling transition completely
    calculatePositions();
    const timer1 = setTimeout(calculatePositions, 50);
    const timer2 = setTimeout(calculatePositions, 150);
    const timer3 = setTimeout(calculatePositions, 300);
    const timer4 = setTimeout(calculatePositions, 600);

    window.addEventListener('resize', calculatePositions);
    // Use capture phase (true) to capture scroll events on any child scrollable element (like <main>)
    window.addEventListener('scroll', calculatePositions, true);

    return () => {
      active = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('resize', calculatePositions);
      window.removeEventListener('scroll', calculatePositions, true);
    };
  }, [isActive, currentStep, showCompletion, isMobile, pathname]);

  // Programmatically open/close modals based on current tour step
  useEffect(() => {
    // Dispatch close events for all modals to clean up
    window.dispatchEvent(new Event('vyse_close_add_tx'));
    window.dispatchEvent(new Event('vyse_close_add_bill'));
    window.dispatchEvent(new Event('vyse_close_add_loan'));
    window.dispatchEvent(new Event('vyse_close_add_account'));

    if (isActive && currentStep >= 0 && currentStep < TOUR_STEPS.length && !showCompletion) {
      const step = TOUR_STEPS[currentStep];
      // Only open the modal if we are on the correct path
      if (step.path === pathname) {
        if (step.targetId === 'tour-transaction-form') {
          window.dispatchEvent(new Event('vyse_open_add_tx'));
        } else if (step.targetId === 'tour-bill-form') {
          window.dispatchEvent(new Event('vyse_open_add_bill'));
        } else if (step.targetId === 'tour-loan-form') {
          window.dispatchEvent(new Event('vyse_open_add_loan'));
        } else if (step.targetId === 'tour-account-form') {
          window.dispatchEvent(new Event('vyse_open_add_account'));
        }
      }
    }
  }, [isActive, currentStep, showCompletion, pathname]);

  const handleNext = () => {
    if (currentStep === -1) {
      setCurrentStep(0);
      const nextStep = TOUR_STEPS[0];
      if (nextStep && nextStep.path !== pathname) {
        router.push(nextStep.path);
      }
    } else if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[currentStep + 1];
      setCurrentStep(prev => prev + 1);
      if (nextStep && nextStep.path !== pathname) {
        router.push(nextStep.path);
      }
    } else {
      setShowCompletion(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = TOUR_STEPS[currentStep - 1];
      setCurrentStep(prev => prev - 1);
      if (prevStep && prevStep.path !== pathname) {
        router.push(prevStep.path);
      }
    }
  };

  const handleSkip = () => {
    if (isInitialTour) return;
    setIsActive(false);
    localStorage.removeItem('vyse_tour_active');
    localStorage.removeItem('vyse_tour_step');
  };

  const handleFinish = () => {
    setIsActive(false);
    setShowCompletion(false);
    localStorage.removeItem('vyse_tour_active');
    localStorage.removeItem('vyse_tour_step');
    localStorage.removeItem('vyse_initial_tour');
  };

  // Extract highlight dimensions if active
  const hTop = highlightStyle ? parseFloat(highlightStyle.top as string) : 0;
  const hLeft = highlightStyle ? parseFloat(highlightStyle.left as string) : 0;
  const hWidth = highlightStyle ? parseFloat(highlightStyle.width as string) : 0;
  const hHeight = highlightStyle ? parseFloat(highlightStyle.height as string) : 0;
  const hasValidHighlight = highlightStyle && !isNaN(hTop) && !isNaN(hLeft) && !isNaN(hWidth) && !isNaN(hHeight);
  const R = hasValidHighlight ? Math.min(20, Math.floor(hWidth / 2), Math.floor(hHeight / 2)) : 0;

  if (!isActive) return null;

  return (
    <>
      {/* Dark Overlay Backdrop with soft rounded cutout using 10-panel CSS masking */}
      {(!hasValidHighlight || currentStep === -1 || showCompletion) ? (
        <div 
          className={`fixed inset-0 bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 animate-in fade-in ${isInitialTour ? '' : 'cursor-pointer'}`}
          onClick={handleSkip}
        />
      ) : (
        <>
          {/* Top Panel */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: 0,
              top: 0,
              width: '100vw',
              height: `${hTop}px`
            }}
            onClick={handleSkip}
          />
          {/* Bottom Panel */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: 0,
              top: `${hTop + hHeight}px`,
              width: '100vw',
              height: `calc(100vh - ${hTop + hHeight}px)`
            }}
            onClick={handleSkip}
          />
          {/* Left Panel */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: 0,
              top: `${hTop}px`,
              width: `${hLeft}px`,
              height: `${hHeight}px`
            }}
            onClick={handleSkip}
          />
          {/* Right Panel */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: `${hLeft + hWidth}px`,
              top: `${hTop}px`,
              width: `calc(100vw - ${hLeft + hWidth}px)`,
              height: `${hHeight}px`
            }}
            onClick={handleSkip}
          />
          {/* Top-Left Corner */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: `${hLeft}px`,
              top: `${hTop}px`,
              width: `${R}px`,
              height: `${R}px`,
              maskImage: `radial-gradient(circle at 100% 100%, transparent ${R}px, black ${R}px)`,
              WebkitMaskImage: `radial-gradient(circle at 100% 100%, transparent ${R}px, black ${R}px)`
            }}
            onClick={handleSkip}
          />
          {/* Top-Right Corner */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: `${hLeft + hWidth - R}px`,
              top: `${hTop}px`,
              width: `${R}px`,
              height: `${R}px`,
              maskImage: `radial-gradient(circle at 0% 100%, transparent ${R}px, black ${R}px)`,
              WebkitMaskImage: `radial-gradient(circle at 0% 100%, transparent ${R}px, black ${R}px)`
            }}
            onClick={handleSkip}
          />
          {/* Bottom-Left Corner */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: `${hLeft}px`,
              top: `${hTop + hHeight - R}px`,
              width: `${R}px`,
              height: `${R}px`,
              maskImage: `radial-gradient(circle at 100% 0%, transparent ${R}px, black ${R}px)`,
              WebkitMaskImage: `radial-gradient(circle at 100% 0%, transparent ${R}px, black ${R}px)`
            }}
            onClick={handleSkip}
          />
          {/* Bottom-Right Corner */}
          <div 
            className={`fixed bg-black/65 backdrop-blur-[1.5px] z-[9990] transition-opacity duration-300 ${isInitialTour ? '' : 'cursor-pointer'}`}
            style={{
              left: `${hLeft + hWidth - R}px`,
              top: `${hTop + hHeight - R}px`,
              width: `${R}px`,
              height: `${R}px`,
              maskImage: `radial-gradient(circle at 0% 0%, transparent ${R}px, black ${R}px)`,
              WebkitMaskImage: `radial-gradient(circle at 0% 0%, transparent ${R}px, black ${R}px)`
            }}
            onClick={handleSkip}
          />
        </>
      )}

      {/* Welcome Step Popup */}
      {currentStep === -1 && !showCompletion && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] animate-in fade-in zoom-in-95 duration-250">
          <div 
            style={{ backgroundColor: 'oklch(0.98 0.008 75)' }}
            className="w-full max-w-md border border-neutral-800/80 p-8 rounded-2xl relative shadow-2xl text-center"
          >
            {/* Top glowing accent line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

            <div className="space-y-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-indigo-100 shadow-xl shadow-indigo-600/10">
                <Sparkles className="h-7 w-7 text-indigo-300 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-neutral-100 tracking-tight">
                  Welcome to Your Workspace!
                </h3>
                <p className="text-xs text-neutral-450 leading-relaxed">
                  Let&apos;s take a quick 1-minute interactive walkthrough to get you familiar with your new financial dashboard dashboards.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={handleNext}
                  className="px-5 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1"
                >
                  <span>Start Tour</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                {!isInitialTour && (
                  <button
                    onClick={handleSkip}
                    className="px-4 h-10 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided Walkthrough Steps */}
      {currentStep >= 0 && currentStep < TOUR_STEPS.length && !showCompletion && (
        <>
          {/* Highlight Box Overlay */}
          {highlightStyle && (
            <div 
              style={{
                ...highlightStyle,
                borderRadius: `${R}px`
              }}
              className="border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.55)] pointer-events-none transition-all duration-200 animate-in fade-in"
            />
          )}

          {/* Floating Tooltip Card */}
          {tooltipStyle && (
            <div 
              style={{ ...tooltipStyle, backgroundColor: 'oklch(0.98 0.008 75)' }}
              className="border border-neutral-800/80 p-5 rounded-2xl shadow-2xl relative flex flex-col justify-between select-none animate-in fade-in slide-in-from-bottom-2 duration-250 w-full"
            >
              {/* Stepper progress indicator bar */}
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <h4 className="text-sm font-extrabold text-neutral-100 tracking-tight">
                  {TOUR_STEPS[currentStep].title}
                </h4>
                {!isInitialTour && (
                  <button 
                    onClick={handleSkip}
                    className="text-neutral-550 hover:text-neutral-350 p-0.5 rounded transition-colors cursor-pointer"
                    title="Skip Tour"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-400 leading-relaxed mt-2 mb-4">
                {TOUR_STEPS[currentStep].description}
              </p>

              {/* Toolbar Actions */}
              <div className="flex justify-between items-center border-t border-neutral-850 pt-3 mt-1">
                <span className="text-[10px] font-bold text-neutral-500 tracking-wide">
                  {currentStep + 1} of {TOUR_STEPS.length}
                </span>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="h-8 px-2.5 rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-neutral-250 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleNext}
                    className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Completion Modal Popup */}
      {showCompletion && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] animate-in fade-in zoom-in-95 duration-250">
          <div 
            style={{ backgroundColor: 'oklch(0.98 0.008 75)' }}
            className="w-full max-w-md border border-neutral-850/80 p-8 rounded-2xl relative shadow-2xl text-center"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

            <div className="space-y-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-950 border border-emerald-850 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-900/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-450" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-neutral-100 tracking-tight">
                  You&apos;re Ready to Roll!
                </h3>
                <p className="text-xs text-neutral-450 leading-relaxed max-w-sm mx-auto">
                  You&apos;ve successfully completed the tour. You can restart the tour at any time by clicking &quot;Restart Product Tour&quot; in the sidebar.
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/10 cursor-pointer"
              >
                Let&apos;s Go!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to allow scrolling the bottom elements to the center of the screen during the tour */}
      {isActive && !showCompletion && (
        <div 
          className="h-[60vh] pointer-events-none w-full" 
          aria-hidden="true"
          style={{ contentVisibility: 'auto' }}
        />
      )}
    </>
  );
}
