"use client";

import React, { createContext, useContext, useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle, Info } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning' | 'success' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
    }
  };

  const getIcon = () => {
    switch (options?.type) {
      case 'danger':
        return <AlertCircle className="h-6 w-6 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500 shrink-0" />;
      default:
        return <HelpCircle className="h-6 w-6 text-indigo-500 shrink-0" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (options?.type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-550 border-rose-500/25';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-550 border-amber-500/25';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-550 border-emerald-500/25';
      case 'info':
        return 'bg-indigo-600 hover:bg-indigo-550 border-indigo-500/25';
      default:
        return 'bg-indigo-600 hover:bg-indigo-550 border-indigo-500/25';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleCancel();
      }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md bg-neutral-900/95 border border-neutral-850 text-neutral-100 p-6 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex gap-4">
            <div className="shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-neutral-100">
                  {options?.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400">
                  {options?.message}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-2 flex flex-row gap-2 justify-end sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-all duration-150 cursor-pointer"
            >
              {options?.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`h-9 px-4 text-xs font-bold rounded-lg text-white border transition-all duration-150 active:scale-97 cursor-pointer ${getConfirmButtonStyles()}`}
            >
              {options?.confirmText || 'Confirm'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider');
  }
  return context.confirm;
}
