import { create } from 'zustand';
import { auth, db } from '@/lib/supabase';
import { Profile, Account, Category, Transaction, RecurringBill, Loan } from '@/lib/db-mock';

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
  loading: boolean;
  timeFilter: TimeFilter;
  customDateRange: DateRange;
  
  // Actions
  fetchUser: () => Promise<Profile | null>;
  login: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchData: () => Promise<void>;
  
  addAccount: (name: string, type: Account['type'], initialBalance: number, color: string) => Promise<boolean>;
  addTransaction: (data: {
    accountId: string;
    categoryId: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: string;
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
}

export const useFinanceStore = create<FinanceState>((set) => ({
  user: null,
  accounts: [],
  categories: [],
  transactions: [],
  bills: [],
  loans: [],
  loading: true,
  timeFilter: 'all',
  customDateRange: { from: null, to: null },

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

  signUpWithEmail: async (email, password, fullName) => {
    const res = await auth.signUpWithEmailAndPassword(email, password, fullName);
    if (res.success) {
      const currentUser = await auth.getCurrentUser();
      set({ user: currentUser });
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  },

  logout: async () => {
    await auth.signOut();
    set({ user: null, accounts: [], transactions: [], bills: [], loans: [] });
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

      set({
        accounts: accs,
        categories: cats,
        transactions: txs,
        bills: billsList,
        loans: loansList,
        loading: false
      });
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      set({ loading: false });
    }
  },

  addAccount: async (name, type, initialBalance, color) => {
    const acc = await db.createAccount(name, type, initialBalance, color);
    if (acc) {
      set(state => ({ accounts: [...state.accounts, acc] }));
      return true;
    }
    return false;
  },

  addTransaction: async (data) => {
    const tx = await db.createTransaction(data);
    if (tx) {
      // Refresh both transactions and accounts since balances change
      const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
      set({ accounts: accs, transactions: txs });
      return true;
    }
    return false;
  },

  deleteTransaction: async (id) => {
    const success = await db.deleteTransaction(id);
    if (success) {
      // Refresh both transactions and accounts since balances change
      const [accs, txs] = await Promise.all([db.getAccounts(), db.getTransactions()]);
      set({ accounts: accs, transactions: txs });
      return true;
    }
    return false;
  },

  addBill: async (data) => {
    const bill = await db.createBill(data);
    if (bill) {
      set(state => ({ bills: [...state.bills, bill] }));
      return true;
    }
    return false;
  },

  payBill: async (billId, accountId) => {
    const tx = await db.payBill(billId, accountId);
    if (tx) {
      const [accs, txs, billsList] = await Promise.all([
        db.getAccounts(),
        db.getTransactions(),
        db.getBills()
      ]);
      set({ accounts: accs, transactions: txs, bills: billsList });
      return true;
    }
    return false;
  },

  addLoan: async (data) => {
    const loan = await db.createLoan(data);
    if (loan) {
      set(state => ({ loans: [...state.loans, loan] }));
      return true;
    }
    return false;
  },

  makeLoanPayment: async (loanId, accountId, amount, lateCharge, comment) => {
    const tx = await db.makeLoanPayment(loanId, accountId, amount, lateCharge, comment);
    if (tx) {
      const [accs, txs, loansList] = await Promise.all([
        db.getAccounts(),
        db.getTransactions(),
        db.getLoans()
      ]);
      set({ accounts: accs, transactions: txs, loans: loansList });
      return true;
    }
    return false;
  },

  setTimeFilter: (filter) => set({ timeFilter: filter }),
  setCustomDateRange: (range) => set({ customDateRange: range })
}));
