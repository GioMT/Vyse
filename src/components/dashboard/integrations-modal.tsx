"use client";

import React, { useState } from 'react';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { 
  Globe, 
  Link2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  Lock, 
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  KeyRound,
  Check,
  Zap
} from 'lucide-react';


interface IntegrationsModalProps {
  onSuccess: () => void;
}

const INSTITUTIONS = [
  { name: 'BDO Unibank', color: 'bg-amber-500', textColor: 'text-neutral-950', logoText: 'BDO' },
  { name: 'BPI (Bank of the Philippine Islands)', color: 'bg-rose-700', textColor: 'text-rose-100', logoText: 'BPI' },
  { name: 'UnionBank of the Philippines', color: 'bg-orange-600', textColor: 'text-orange-100', logoText: 'UBP' },
  { name: 'GCash Wallet', color: 'bg-blue-600', textColor: 'text-blue-100', logoText: 'GCash' },
];

export default function IntegrationsModal({ onSuccess }: IntegrationsModalProps) {
  const { 
    bankConnections, 
    geminiKey, 
    linkBank, 
    syncBank, 
    setGeminiKey,
    autoCategorizeAll
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'bank' | 'gemini'>('bank');
  
  // Link flow states
  const [linking, setLinking] = useState(false);
  const [linkStep, setLinkStep] = useState(1);
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Gemini key states
  const [localKey, setLocalKey] = useState(geminiKey);
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  
  // AI batch categorization state
  const [categorizing, setCategorizing] = useState(false);
  const [categorizedCount, setCategorizedCount] = useState<number | null>(null);

  // Sync state per connection
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleLinkStart = () => {
    setLinking(true);
    setLinkStep(1);
    setSelectedInst(null);
    setUsername('');
    setPassword('');
  };

  const handleSelectInst = (instName: string) => {
    setSelectedInst(instName);
    setLinkStep(2);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLinkStep(3); // Connecting spinner
    
    // Simulate Plaid OAuth server latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create checking and credit accounts for this institution
    const accountsData = [
      { name: `${selectedInst} Checking`, balance: 2500 + Math.random() * 5000, type: 'checking' as const },
      { name: `${selectedInst} Premier Credit`, balance: 400 + Math.random() * 800, type: 'credit' as const }
    ];

    const success = await linkBank(selectedInst || 'Bank', accountsData);
    if (success) {
      setLinkStep(4); // Success screen
    } else {
      setLinking(false);
    }
  };

  const handleSyncConnection = async (id: string) => {
    setSyncingId(id);
    const success = await syncBank(id);
    if (success) {
      // Small simulated toast
      console.log('Simulated connection sync successfully completed');
    }
    setSyncingId(null);
  };

  const handleSaveGeminiKey = async () => {
    setSavingKey(true);
    // Simulate verification check
    await new Promise(resolve => setTimeout(resolve, 600));
    setGeminiKey(localKey);
    setSavingKey(false);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleTriggerAICategorize = async () => {
    setCategorizing(true);
    setCategorizedCount(null);
    try {
      await autoCategorizeAll();
      setCategorizedCount(1); // simulate count or indicate finished
      // reload data
    } catch (e) {
      console.error(e);
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg bg-popover/92 backdrop-blur-md border border-neutral-850 text-neutral-100 p-6 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-neutral-100 flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-400" />
          <span>Integrations & Live Sync</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-neutral-500">
          Configure real-time bank feeds via Brankas Open Finance API and smart LLM categorizations.
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex border-b border-neutral-850 mb-4">
        <button
          onClick={() => { setActiveTab('bank'); setLinking(false); }}
          className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center cursor-pointer ${
            activeTab === 'bank'
              ? 'border-indigo-500 text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Bank Feeds (Brankas)
        </button>
        <button
          onClick={() => { setActiveTab('gemini'); setLinking(false); }}
          className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 text-center cursor-pointer ${
            activeTab === 'gemini'
              ? 'border-indigo-500 text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          AI Classification (Gemini 1.5)
        </button>
      </div>

      {/* BANK TAB */}
      {activeTab === 'bank' && (
        <div className="space-y-4 py-2 text-left">
          {!linking ? (
            <>
              {/* Linked connections list */}
              {bankConnections.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-550">Linked Bank Feeds</h3>
                  {bankConnections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-850/80">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                          <Building className="h-4.5 w-4.5 text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-100">{conn.institution_name}</span>
                          <span className="text-[10px] text-neutral-500">
                            Status: <span className="text-emerald-500 font-semibold">Active</span> • Synced {new Date(conn.last_synced_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSyncConnection(conn.id)}
                        disabled={syncingId !== null}
                        className="h-8 px-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-[10px] font-bold text-neutral-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {syncingId === conn.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>Sync Feeds</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-3.5 bg-neutral-950/20">
                  <div className="h-11 w-11 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 text-neutral-500">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-neutral-200">No active card links</h4>
                    <p className="text-[10px] text-neutral-500 max-w-[280px] leading-normal mx-auto">
                      Link checking, savings, or credit card accounts to pull data in real-time.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLinkStart}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-4"
              >
                <Link2 className="h-4 w-4" />
                <span>Link a Bank Account (Brankas)</span>
              </button>
            </>
          ) : (
            /* PLAID SIMULATOR FLOW */
            <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between border-b border-neutral-850/60 pb-2.5">
                <span className="text-xs font-bold text-neutral-450 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Brankas Link Simulator</span>
                </span>
                <span className="text-[10px] text-neutral-500">Step {linkStep} of 4</span>
              </div>

              {/* STEP 1: SELECT BANK */}
              {linkStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Select your financial institution</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {INSTITUTIONS.map((inst) => (
                      <button
                        key={inst.name}
                        onClick={() => handleSelectInst(inst.name)}
                        className="p-3 rounded-xl border border-neutral-850 hover:border-indigo-500/50 hover:bg-neutral-900 text-left transition-all cursor-pointer flex flex-col justify-between h-20"
                      >
                        <div className={`px-2 py-0.5 rounded text-[8px] font-extrabold w-fit ${inst.color} ${inst.textColor}`}>
                          {inst.logoText}
                        </div>
                        <span className="text-xs font-bold text-neutral-200">{inst.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: CREDENTIALS */}
              {linkStep === 2 && (
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-400 leading-normal">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Enter any mock credentials to simulate connecting your <strong>{selectedInst}</strong> accounts via Brankas.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Username</label>
                    <Input
                      type="text"
                      placeholder="e.g. user_sandbox"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setLinkStep(1)}
                      className="flex-1 h-9 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:bg-neutral-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold cursor-pointer"
                    >
                      Authorize Link
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: LOADING */}
              {linkStep === 3 && (
                <div className="py-8 text-center space-y-4">
                  <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-neutral-200">Connecting via Brankas Open Finance</h5>
                    <p className="text-[10px] text-neutral-500 leading-normal max-w-xs mx-auto">
                      Exchanging credentials for secure customer authorization tokens.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS */}
              {linkStep === 4 && (
                <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="h-12 w-12 rounded-full bg-emerald-950 border border-emerald-850 flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-neutral-100">Connection Established!</h5>
                    <p className="text-[10px] text-neutral-500 leading-normal max-w-[260px] mx-auto">
                      <strong>{selectedInst}</strong> linked. Checking & Credit balances are synced in real-time.
                    </p>
                  </div>
                  <button
                    onClick={() => setLinking(false)}
                    className="h-9 px-6 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* GEMINI AI TAB */}
      {activeTab === 'gemini' && (
        <div className="space-y-4 py-2 text-left">
          <div className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-850/80 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-200">Gemini 1.5 Flash Categorizer</h4>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Leverages Gemini&apos;s API to analyze bank statements. Flash extracts clear merchant strings and auto-assigns the best matched category.
                </p>
              </div>
            </div>
            
            <div className="border-t border-neutral-900 pt-2.5 flex items-center justify-between text-[10px] text-neutral-500">
              <span>Integration Status:</span>
              {geminiKey ? (
                <span className="text-indigo-400 font-extrabold flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-indigo-400" />
                  <span>Gemini API (Live)</span>
                </span>
              ) : (
                <span className="text-amber-500 font-extrabold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Offline Simulation (Fallback)</span>
                </span>
              )}
            </div>
          </div>

          {/* Key configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Google AI Studio API Key</label>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Get a Free Key
              </a>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                className="pl-9 pr-10 bg-neutral-950 border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-350 cursor-pointer"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            
            <button
              onClick={handleSaveGeminiKey}
              disabled={savingKey}
              className="w-full h-9 rounded-lg bg-neutral-900 hover:bg-neutral-850 active:scale-[0.98] border border-neutral-800 text-xs font-bold text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingKey ? (
                <div className="h-4 w-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
              ) : keySaved ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500">API Key Configured!</span>
                </>
              ) : (
                'Configure Gemini API Key'
              )}
            </button>
          </div>

          {/* Trigger auto categorization */}
          <div className="border-t border-neutral-850/80 pt-4 space-y-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-neutral-200">Re-categorize Ledger Database</span>
              <span className="text-[10px] text-neutral-500">Scan existing ledger imports and parse uncategorized statements with AI model instructions.</span>
            </div>
            
            <button
              onClick={handleTriggerAICategorize}
              disabled={categorizing}
              className="w-full h-9 rounded-lg bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {categorizing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing transactions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Auto-Categorize All Transactions</span>
                </>
              )}
            </button>
            
            {categorizedCount !== null && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[9px] text-emerald-500 justify-center">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>AI run complete. Transaction ledger successfully classified!</span>
              </div>
            )}
          </div>
        </div>
      )}

      <DialogFooter className="pt-2 sm:justify-end border-t border-neutral-850/60 mt-2">
        <button
          onClick={onSuccess}
          className="h-10 px-6 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 text-xs font-bold cursor-pointer active:scale-95 transition-colors"
        >
          Close Panel
        </button>
      </DialogFooter>
    </DialogContent>
  );
}
