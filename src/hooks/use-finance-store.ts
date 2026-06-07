import { create } from 'zustand';
import { auth, db, isDemoMode, supabase } from '@/lib/supabase';
import { 
  Profile, 
  Account, 
  Category, 
  Transaction, 
  RecurringBill, 
  Loan,
  DEFAULT_ACCOUNTS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_BILLS,
  DEFAULT_LOANS,
  MockDatabase,
  BankConnection
} from '@/lib/db-mock';

interface DateRange {
  from: string | null;
  to: string | null;
}

export type TimeFilter = '7d' | '30d' | 'this-month' | 'last-month' | 'all' | 'custom';

interface FinanceState {
  user: Profile | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  bills: RecurringBill[];
  loans: Loan[];
  
  realAccounts: Account[];
  realTransactions: Transaction[];
  realBills: RecurringBill[];
  realLoans: Loan[];
  isTourActive: boolean;
  
  loading: boolean;
  timeFilter: TimeFilter;
  customDateRange: DateRange;
  
  // Actions
  fetchUser: () => Promise<Profile | null>;
  login: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string, dob?: string, sex?: string) => Promise<{ success: boolean; needsVerification: boolean; error?: string }>;
  checkEmailExists: (email: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (fullName: string, dob: string, sex: string, onboarded?: boolean, currency?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: () => Promise<boolean>;
  logout: () => Promise<void>;
  fetchData: () => Promise<void>;
  setTourActive: (active: boolean) => void;
  
  addAccount: (name: string, type: Account['type'], initialBalance: number, color: string, accountNumber?: string) => Promise<boolean>;
  updateAccount: (id: string, name: string, type: Account['type'], balance: number, color: string, accountNumber?: string) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  addTransaction: (data: {
    accountId: string;
    categoryId?: string;
    toAccountId?: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    date: string;
    additionalCharge?: number;
  }) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  addBill: (data: {
    name: string;
    amount: number;
    categoryId: string;
    frequency: RecurringBill['frequency'];
    nextDueDate: string;
    autoPay: boolean;
  }) => Promise<boolean>;
  payBill: (billId: string, accountId: string) => Promise<boolean>;
  
  addLoan: (data: {
    name: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    paymentFrequency: 'monthly' | 'bi-monthly';
    firstPaymentDay?: number;
    secondPaymentDay?: number;
    startDate: string;
  }) => Promise<boolean>;
  makeLoanPayment: (loanId: string, accountId: string, amount: number, lateCharge?: number, comment?: string) => Promise<boolean>;
  
  setTimeFilter: (filter: TimeFilter) => void;
  setCustomDateRange: (range: DateRange) => void;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string) => Promise<boolean>;
  updateUserPassword: (newPassword: string) => Promise<boolean>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Bank Link Actions
  bankConnections: BankConnection[];
  geminiKey: string;
  loadingConnections: boolean;
  linkBank: (institutionName: string, accounts: Array<{ name: string; balance: number; type: Account['type'] }>) => Promise<boolean>;
  syncBank: (connectionId: string) => Promise<boolean>;
  setGeminiKey: (key: string) => void;
  categorizeWithAI: (txId: string) => Promise<boolean>;
  autoCategorizeAll: () => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => {
  const updateStoreState = (updates: {
    accounts?: Account[];
    transactions?: Transaction[];
    bills?: RecurringBill[];
    loans?: Loan[];
    isTourActive?: boolean;
  }) => {
    const state = get();
    const isTour = updates.isTourActive !== undefined ? updates.isTourActive : state.isTourActive;
    const userId = state.user?.id || 'demo-user-id';

    const realAccs = updates.accounts !== undefined ? updates.accounts : state.realAccounts;
    const realTxs = updates.transactions !== undefined ? updates.transactions : state.realTransactions;
    const realBillsList = updates.bills !== undefined ? updates.bills : state.realBills;
    const realLoansList = updates.loans !== undefined ? updates.loans : state.realLoans;

    set({
      realAccounts: realAccs,
      realTransactions: realTxs,
      realBills: realBillsList,
      realLoans: realLoansList,
      isTourActive: isTour,
      
      accounts: isTour ? DEFAULT_ACCOUNTS(userId) : realAccs,
      transactions: isTour ? DEFAULT_TRANSACTIONS(userId) : realTxs,
      bills: isTour ? DEFAULT_BILLS(userId) : realBillsList,
      loans: isTour ? DEFAULT_LOANS(userId) : realLoansList,
    });
  };

  return {
    user: null,
    accounts: [],
    categories: [],
    transactions: [],
    bills: [],
    loans: [],

    realAccounts: [],
    realTransactions: [],
    realBills: [],
    realLoans: [],
    isTourActive: typeof window !== 'undefined' ? localStorage.getItem('vyse_tour_active') === 'true' : false,

    loading: true,
    timeFilter: 'all',
    customDateRange: { from: null, to: null },
    bankConnections: [],
    geminiKey: typeof window !== 'undefined' ? localStorage.getItem('vyse_gemini_key') || '' : '',
    loadingConnections: false,

    fetchUser: async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        set({ user: currentUser });
        return currentUser;
      } catch (e) {
        console.error(e);
        return null;
      }
    },

    login: async () => {
      const res = await auth.signInWithGoogle();
      if (res.success) {
        const currentUser = await auth.getCurrentUser();
        set({ user: currentUser });
        return true;
      }
      return false;
    },

    loginWithEmail: async (email, password) => {
      const res = await auth.signInWithEmailAndPassword(email, password);
      if (res.success) {
        const currentUser = await auth.getCurrentUser();
        set({ user: currentUser });
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    },

    signUpWithEmail: async (email, password, fullName, dob, sex) => {
      const res = await auth.signUpWithEmailAndPassword(email, password, fullName, dob, sex);
      if (res.success) {
        if (!res.needsVerification) {
          const currentUser = await auth.getCurrentUser();
          set({ user: currentUser });
        }
        return { success: true, needsVerification: res.needsVerification };
      }
      return { success: false, needsVerification: false, error: res.error || 'Registration failed' };
    },

    checkEmailExists: async (email) => {
      return await auth.checkEmailExists(email);
    },

    resendVerificationEmail: async (email) => {
      return await auth.resendVerificationEmail(email);
    },

    updateProfile: async (fullName, dob, sex, onboarded, currency, password) => {
      const res = await auth.updateProfile(fullName, dob, sex, onboarded, currency, password);
      if (res.success && res.profile) {
        set({ user: res.profile });
        return { success: true };
      }
      return { success: false, error: res.error || 'Profile update failed' };
    },

    deleteUserAccount: async () => {
      if (isDemoMode()) {
        MockDatabase.deleteMockUser();
        set({ user: null });
        return true;
      }
      if (supabase) {
        const { error } = await supabase.rpc('delete_own_user');
        if (error) {
          console.error('Error closing user account:', error.message);
          return false;
        }
        set({ user: null });
        return true;
      }
      return false;
    },

    logout: async () => {
      await auth.signOut();
      updateStoreState({
        accounts: [],
        transactions: [],
        bills: [],
        loans: [],
        isTourActive: false
      });
      set({ user: null });
    },

    fetchData: async () => {
      set({ loading: true });
      try {
        // 1. Run simulation first (auto-pay due bills in demo mode)
        await db.runAutoPaySimulation();

        // 2. Fetch everything
        const [accs, cats, txs, billsList, loansList] = await Promise.all([
          db.getAccounts(),
          db.getCategories(),
          db.getTransactions(),
          db.getBills(),
          db.getLoans()
        ]);

        const connections = MockDatabase.getBankConnections();

        set({ categories: cats, bankConnections: connections, loading: false });
        updateStoreState({
          accounts: accs,
          transactions: txs,
          bills: billsList,
          loans: loansList
        });
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
        set({ loading: false });
      }
    },

    setTourActive: (active) => {
      updateStoreState({ isTourActive: active });
    },

    addAccount: async (name, type, initialBalance, color, accountNumber) => {
      if (get().isTourActive) return true;
      const acc = await db.createAccount(name, type, initialBalance, color, accountNumber);
      if (acc) {
        updateStoreState({ accounts: [...get().realAccounts, acc] });
        return true;
      }
      return false;
    },

    updateAccount: async (id, name, type, balance, color, accountNumber) => {
      if (get().isTourActive) return true;
      const success = await db.updateAccount(id, name, type, balance, color, accountNumber);
      if (success) {
        const accs = await db.getAccounts();
        updateStoreState({ accounts: accs });
        return true;
      }
      return false;
    },

    deleteAccount: async (id) => {
      if (get().isTourActive) return true;
      const success = await db.deleteAccount(id);
      if (success) {
        const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
        updateStoreState({ accounts: accs, transactions: txs });
        return true;
      }
      return false;
    },

    addTransaction: async (data) => {
      if (get().isTourActive) return true;
      if (data.type === 'transfer') {
        const timestamp = Date.now();
        const refId = `tx-tr-${timestamp}`;
        const additionalCharge = data.additionalCharge || 0;
        
        // Fetch account names for description metadata
        const state = get();
        const fromAcc = state.accounts.find(a => a.id === data.accountId);
        const toAcc = state.accounts.find(a => a.id === data.toAccountId);
        const fromAccName = fromAcc ? fromAcc.name : 'Account';
        const toAccName = toAcc ? toAcc.name : 'Account';
        
        const sourceDesc = `${data.description || 'Transfer'} to ${toAccName} [Fee: ${additionalCharge.toFixed(2)}] (Ref: ${refId})`;
        const destDesc = `${data.description || 'Transfer'} from ${fromAccName} (Ref: ${refId})`;
        
        // 1. Create source account expense (amount + fee)
        const sourceTx = await db.createTransaction({
          accountId: data.accountId,
          categoryId: 'cat-exp-other', // Default to Other Expense for transfers
          amount: data.amount + additionalCharge,
          type: 'expense',
          description: sourceDesc,
          date: data.date
        });
        
        if (!sourceTx) return false;
        
        // 2. Create destination account income (base amount)
        const destTx = await db.createTransaction({
          accountId: data.toAccountId || '',
          categoryId: 'cat-inc-other', // Default to Other Income for transfers
          amount: data.amount,
          type: 'income',
          description: destDesc,
          date: data.date
        });
        
        if (!destTx) {
          // Rollback source transaction if destination fails
          await db.deleteTransaction(sourceTx.id);
          return false;
        }
        
        const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
        updateStoreState({ accounts: accs, transactions: txs });
        return true;
      } else {
        const additionalCharge = data.additionalCharge || 0;
        const finalAmount = data.type === 'expense' ? (data.amount + additionalCharge) : data.amount;
        const finalDescription = additionalCharge > 0 
          ? `${data.description} [Fee: ${additionalCharge.toFixed(2)}]`
          : data.description;
          
        const tx = await db.createTransaction({
          accountId: data.accountId,
          categoryId: data.categoryId || '',
          amount: finalAmount,
          type: data.type === 'income' ? 'income' : 'expense',
          description: finalDescription,
          date: data.date
        });
        
        if (tx) {
          const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
          updateStoreState({ accounts: accs, transactions: txs });
          return true;
        }
        return false;
      }
    },

    deleteTransaction: async (id) => {
      if (get().isTourActive) return true;
      const state = get();
      const target = state.transactions.find(t => t.id === id);
      if (target) {
        const refMatch = target.description.match(/\(Ref:\s*(tx-tr-\d+)\)/);
        if (refMatch) {
          const refId = refMatch[1];
          // Find all transactions containing this reference ID
          const linkedTxs = state.transactions.filter(t => t.description.includes(`(Ref: ${refId})`));
          // Delete all linked transactions
          await Promise.all(linkedTxs.map(t => db.deleteTransaction(t.id)));
        } else {
          await db.deleteTransaction(id);
        }
      } else {
        await db.deleteTransaction(id);
      }
      
      // Refresh both transactions and accounts since balances change
      const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
      updateStoreState({ accounts: accs, transactions: txs });
      return true;
    },

    addBill: async (data) => {
      if (get().isTourActive) return true;
      const bill = await db.createBill(data);
      if (bill) {
        updateStoreState({ bills: [...get().realBills, bill] });
        return true;
      }
      return false;
    },

    payBill: async (billId, accountId) => {
      if (get().isTourActive) return true;
      const tx = await db.payBill(billId, accountId);
      if (tx) {
        const [accs, txs, billsList] = await Promise.all([
          db.getAccounts(),
          db.getTransactions(),
          db.getBills()
        ]);
        updateStoreState({ accounts: accs, transactions: txs, bills: billsList });
        return true;
      }
      return false;
    },

    addLoan: async (data) => {
      if (get().isTourActive) return true;
      const loan = await db.createLoan(data);
      if (loan) {
        updateStoreState({ loans: [...get().realLoans, loan] });
        return true;
      }
      return false;
    },

    makeLoanPayment: async (loanId, accountId, amount, lateCharge, comment) => {
      if (get().isTourActive) return true;
      const tx = await db.makeLoanPayment(loanId, accountId, amount, lateCharge, comment);
      if (tx) {
        const [accs, txs, loansList] = await Promise.all([
          db.getAccounts(),
          db.getTransactions(),
          db.getLoans()
        ]);
        updateStoreState({ accounts: accs, transactions: txs, loans: loansList });
        return true;
      }
      return false;
    },

    setTimeFilter: (filter) => set({ timeFilter: filter }),
    setCustomDateRange: (range) => set({ customDateRange: range }),
    
    verifyCurrentPassword: async (password) => {
      if (isDemoMode()) {
        return MockDatabase.verifyCurrentPassword(password);
      }
      if (supabase) {
        const user = get().user;
        if (!user) return false;
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
        return !error;
      }
      return false;
    },

    updateUserEmail: async (newEmail) => {
      if (isDemoMode()) {
        const success = MockDatabase.updateEmail(newEmail);
        if (success) {
          set({ user: MockDatabase.getSessionUser() });
          return true;
        }
        return false;
      }
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) return false;
        return true;
      }
      return false;
    },

    updateUserPassword: async (newPassword) => {
      if (isDemoMode()) {
        return MockDatabase.updatePassword(newPassword);
      }
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return !error;
      }
      return false;
    },

    sendPasswordResetEmail: async (email) => {
      return await auth.resetPasswordForEmail(email);
    },

    linkBank: async (institutionName, accountsData) => {
      const conn = MockDatabase.linkMockBankConnection(institutionName, accountsData);
      if (conn) {
        const conns = MockDatabase.getBankConnections();
        const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
        set({ bankConnections: conns });
        updateStoreState({ accounts: accs, transactions: txs });
        return true;
      }
      return false;
    },

    syncBank: async (connectionId) => {
      set({ loadingConnections: true });
      try {
        const count = await MockDatabase.syncMockBankConnection(connectionId);
        const conns = MockDatabase.getBankConnections();
        const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
        set({ bankConnections: conns, loadingConnections: false });
        updateStoreState({ accounts: accs, transactions: txs });
        
        // Auto-categorize synced transaction if a Gemini key is present
        if (count > 0 && txs.length > 0) {
          const syncedTx = txs[0]; // the newly added transaction
          const state = get();
          if (state.geminiKey) {
            await state.categorizeWithAI(syncedTx.id);
          }
        }
        return true;
      } catch (e) {
        console.error(e);
        set({ loadingConnections: false });
        return false;
      }
    },

    setGeminiKey: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vyse_gemini_key', key);
      }
      set({ geminiKey: key });
    },

    categorizeWithAI: async (txId: string) => {
      const state = get();
      const tx = state.transactions.find(t => t.id === txId);
      if (!tx) return false;

      try {
        const res = await fetch('/api/categorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: tx.description,
            apiKey: state.geminiKey || undefined,
          }),
        });

        if (!res.ok) return false;
        const data = await res.json();
        
        // Find category by name
        const match = state.categories.find(
          c => c.name.toLowerCase() === data.category.toLowerCase()
        );

        if (match) {
          const success = MockDatabase.updateTransactionCategory(txId, match.id, {
            clean_merchant: data.cleanMerchantName,
            confidence: data.confidence,
            is_ai_categorized: true,
            method: data.method,
          });
          if (success) {
            const updatedTxs = await db.getTransactions();
            updateStoreState({ transactions: updatedTxs });
            return true;
          }
        }
      } catch (e) {
        console.error('AI Categorization Error:', e);
      }
      return false;
    },

    autoCategorizeAll: async () => {
      const state = get();
      // Target transactions with "Other Expense" or "Other Income"
      const targetTxs = state.transactions.filter(
        t => t.category_id === 'cat-exp-other' || t.category_id === 'cat-inc-other'
      );
      
      if (targetTxs.length === 0) return;

      // Classify them sequentially to avoid rate-limiting on Gemini free tier
      for (const tx of targetTxs) {
        await state.categorizeWithAI(tx.id);
      }
    }
  };
});
