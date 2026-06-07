"use client";

import React, { useState } from 'react';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

export type ThemeMode = 'system' | 'light' | 'dark';

export const applyTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  } else {
    // System theme
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
};

interface AppearanceSettingsModalProps {
  onSuccess: () => void;
}

export default function AppearanceSettingsModal({ onSuccess }: AppearanceSettingsModalProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vyse_theme') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const handleSelectTheme = (theme: ThemeMode) => {
    setActiveTheme(theme);
    localStorage.setItem('vyse_theme', theme);
    applyTheme(theme);
  };

  return (
    <DialogContent className="sm:max-w-md bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100 flex items-center gap-2">
          <Palette className="h-5 w-5 text-indigo-400" />
          <span>Appearance Settings</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Customize the aesthetic theme of your Vyse workspace interface.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => handleSelectTheme('light')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer text-center relative group active:scale-95 ${
              activeTheme === 'light'
                ? 'bg-neutral-900 border-indigo-500 shadow-md shadow-indigo-600/5'
                : 'bg-neutral-950/40 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-800'
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              activeTheme === 'light' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200'
            }`}>
              <Sun className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-neutral-200">Light Mode</span>
            
            {activeTheme === 'light' && (
              <span className="absolute top-2 right-2 h-4 w-4 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => handleSelectTheme('dark')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer text-center relative group active:scale-95 ${
              activeTheme === 'dark'
                ? 'bg-neutral-900 border-indigo-500 shadow-md shadow-indigo-600/5'
                : 'bg-neutral-950/40 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-800'
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              activeTheme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200'
            }`}>
              <Moon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-neutral-200">Dark Mode</span>

            {activeTheme === 'dark' && (
              <span className="absolute top-2 right-2 h-4 w-4 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </button>

          {/* System Mode Card */}
          <button
            type="button"
            onClick={() => handleSelectTheme('system')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer text-center relative group active:scale-95 ${
              activeTheme === 'system'
                ? 'bg-neutral-900 border-indigo-500 shadow-md shadow-indigo-600/5'
                : 'bg-neutral-950/40 border-neutral-850 hover:bg-neutral-900 hover:border-neutral-800'
            }`}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              activeTheme === 'system' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200'
            }`}>
              <Monitor className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-neutral-200">System</span>

            {activeTheme === 'system' && (
              <span className="absolute top-2 right-2 h-4 w-4 bg-indigo-600 rounded-full flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </button>
        </div>
      </div>

      <DialogFooter>
        <button
          onClick={onSuccess}
          className="w-full h-10 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Save & Close
        </button>
      </DialogFooter>
    </DialogContent>
  );
}
