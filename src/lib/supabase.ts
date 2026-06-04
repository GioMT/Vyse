import { createClient } from '@supabase/supabase-js';
import { MockDatabase, Profile, Account, Category, Transaction, RecurringBill, Loan } from './db-mock';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Determine if we are running in Demo/Mock mode
export const isDemoMode = (): boolean => {
  // If the keys are missing, we fall back to Local Storage Demo mode
  return !supabaseUrl || !supabaseAnonKey;
};

// Create real Supabase client only if keys are present
export const supabase = !isDemoMode() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Auth Actions
export const auth = {
  async getCurrentUser(): Promise<Profile | null> {
    if (isDemoMode()) {
      return MockDatabase.getSessionUser();
    }
    
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile || {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Supabase User',
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at
    };
  },

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode()) {
      const profile = MockDatabase.verifyMockUser(email, password);
      if (profile) {
        if (typeof document !== 'undefined') {
          document.cookie = "pt_session_active=true; path=/; max-age=86400; SameSite=Lax";
        }
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password.' };
    }

    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    if (typeof document !== 'undefined') {
      document.cookie = "pt_session_active=true; path=/; max-age=86400; SameSite=Lax";
    }
    return { success: true };
  },

  async signUpWithEmailAndPassword(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode()) {
      const profile = MockDatabase.createMockUser(email, password, fullName);
      if (profile) {
        if (typeof document !== 'undefined') {
          document.cookie = "pt_session_active=true; path=/; max-age=86400; SameSite=Lax";
        }
        return { success: true };
      }
      return { success: false, error: 'An account with this email already exists.' };
    }

    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) return { success: false, error: error.message };

    // Set cookie on successful sign up
    if (data.user) {
      if (typeof document !== 'undefined') {
        document.cookie = "pt_session_active=true; path=/; max-age=86400; SameSite=Lax";
      }
    }

    return { success: true };
  },

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode()) {
      // Simulate Google login by setting a demo session user
      const mockUser: Profile = {
        id: 'demo-user-id',
        email: 'demo@finance.io',
        full_name: 'Alex Mercer',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        created_at: new Date().toISOString()
      };
      MockDatabase.setSessionUser(mockUser);
      if (typeof document !== 'undefined') {
        document.cookie = "pt_session_active=true; path=/; max-age=86400; SameSite=Lax";
      }
      return { success: true };
    }

    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async signOut(): Promise<void> {
    if (isDemoMode()) {
      MockDatabase.setSessionUser(null);
      if (typeof document !== 'undefined') {
        document.cookie = "pt_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      return;
    }
    if (supabase) {
      await supabase.auth.signOut();
      if (typeof document !== 'undefined') {
        document.cookie = "pt_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }
};

// Database CRUD Actions (Checking demo vs Supabase backend)
export const db = {
  // --- ACCOUNTS ---
  async getAccounts(): Promise<Account[]> {
    if (isDemoMode()) {
      return MockDatabase.getAccounts();
    }
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching accounts:', error.message);
      return [];
    }
    return data || [];
  },

  async createAccount(name: string, type: Account['type'], initialBalance: number, color: string): Promise<Account | null> {
    if (isDemoMode()) {
      return MockDatabase.createAccount(name, type, initialBalance, color);
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name,
        type,
        balance: type === 'credit' ? -Math.abs(initialBalance) : Math.abs(initialBalance),
        color
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error.message);
      return null;
    }
    return data;
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    if (isDemoMode()) {
      return MockDatabase.getCategories();
    }
    if (!supabase) return [];
    
    // Fetch default categories (user_id is null) AND custom categories
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('Error fetching categories:', error.message);
      return [];
    }
    return data || [];
  },

  async createCategory(name: string, type: 'income' | 'expense', color: string, icon: string): Promise<Category | null> {
    if (isDemoMode()) {
      return MockDatabase.createCategory(name, type, color, icon);
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name,
        type,
        color,
        icon
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error.message);
      return null;
    }
    return data;
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    if (isDemoMode()) {
      return MockDatabase.getTransactions();
    }
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error.message);
      return [];
    }
    return data || [];
  },

  async createTransaction(txData: {
    accountId: string;
    categoryId: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }): Promise<Transaction | null> {
    if (isDemoMode()) {
      return MockDatabase.createTransaction(txData);
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Start transaction operation
    // Note: Since Supabase doesn't easily support transactions out of the box in simple JS without RPC, 
    // we use a Postgres trigger (db-side) or handle it on the client side.
    // In our migrations, we will write a trigger that updates the account balance when a transaction is added/deleted.
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: txData.accountId,
        category_id: txData.categoryId,
        amount: txData.amount,
        type: txData.type,
        description: txData.description,
        date: txData.date
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error.message);
      return null;
    }
    return data;
  },

  async deleteTransaction(txId: string): Promise<boolean> {
    if (isDemoMode()) {
      MockDatabase.deleteTransaction(txId);
      return true;
    }
    if (!supabase) return false;
    
    // Deleting a transaction triggers a postgres trigger to update the account balance
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId);

    if (error) {
      console.error('Error deleting transaction:', error.message);
      return false;
    }
    return true;
  },

  // --- RECURRING BILLS ---
  async getBills(): Promise<RecurringBill[]> {
    if (isDemoMode()) {
      return MockDatabase.getBills();
    }
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .order('next_due_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching bills:', error.message);
      return [];
    }
    return data || [];
  },

  async createBill(billData: {
    name: string;
    amount: number;
    categoryId: string;
    frequency: RecurringBill['frequency'];
    nextDueDate: string;
    autoPay: boolean;
  }): Promise<RecurringBill | null> {
    if (isDemoMode()) {
      return MockDatabase.createBill(billData);
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({
        user_id: user.id,
        name: billData.name,
        amount: billData.amount,
        category_id: billData.categoryId,
        frequency: billData.frequency,
        next_due_date: billData.nextDueDate,
        auto_pay: billData.autoPay,
        status: 'unpaid'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bill:', error.message);
      return null;
    }
    return data;
  },

  async payBill(billId: string, accountId: string): Promise<Transaction | null> {
    if (isDemoMode()) {
      return MockDatabase.payBill(billId, accountId);
    }
    if (!supabase) return null;
    
    // In production, we call an RPC or rely on database triggers.
    // For safety, we can insert the transaction, which updates the account balance,
    // and then update the next_due_date of the bill.
    const bills = await this.getBills();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return null;

    const tx = await this.createTransaction({
      accountId,
      categoryId: bill.category_id,
      amount: bill.amount,
      type: 'expense',
      description: `Payment: ${bill.name}`,
      date: new Date().toISOString().split('T')[0]
    });

    if (!tx) return null;

    // Advance next due date
    const d = new Date(bill.next_due_date);
    if (bill.frequency === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (bill.frequency === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else if (bill.frequency === 'yearly') {
      d.setFullYear(d.getFullYear() + 1);
    }

    const { error } = await supabase
      .from('recurring_bills')
      .update({
        next_due_date: d.toISOString().split('T')[0],
        status: 'unpaid'
      })
      .eq('id', billId);

    if (error) {
      console.error('Error advancing bill date:', error.message);
    }

    return tx;
  },

  // --- LOANS ---
  async getLoans(): Promise<Loan[]> {
    if (isDemoMode()) {
      return MockDatabase.getLoans();
    }
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching loans:', error.message);
      return [];
    }
    return data || [];
  },

  async createLoan(loanData: {
    name: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    paymentFrequency: 'monthly' | 'bi-monthly';
    firstPaymentDay?: number;
    secondPaymentDay?: number;
    startDate: string;
  }): Promise<Loan | null> {
    if (isDemoMode()) {
      return MockDatabase.createLoan(loanData);
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: user.id,
        name: loanData.name,
        principal: loanData.principal,
        interest_rate: loanData.interestRate,
        term_months: loanData.termMonths,
        monthly_payment: loanData.monthlyPayment,
        payment_frequency: loanData.paymentFrequency,
        first_payment_day: loanData.firstPaymentDay,
        second_payment_day: loanData.secondPaymentDay,
        remaining_balance: loanData.principal,
        paid_amount: 0,
        start_date: loanData.startDate
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating loan:', error.message);
      return null;
    }
    return data;
  },

  async makeLoanPayment(loanId: string, accountId: string, amount: number): Promise<Transaction | null> {
    if (isDemoMode()) {
      return MockDatabase.makeLoanPayment(loanId, accountId, amount);
    }
    if (!supabase) return null;

    const loans = await this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;

    const actualPayAmount = Math.min(amount, loan.remaining_balance);
    if (actualPayAmount <= 0) return null;

    const tx = await this.createTransaction({
      accountId,
      categoryId: 'cat-exp-other', // default category
      amount: actualPayAmount,
      type: 'expense',
      description: `Loan Payment: ${loan.name}`,
      date: new Date().toISOString().split('T')[0]
    });

    if (!tx) return null;

    // Deduct from loan balance
    const { error } = await supabase
      .from('loans')
      .update({
        remaining_balance: parseFloat((loan.remaining_balance - actualPayAmount).toFixed(2)),
        paid_amount: parseFloat((loan.paid_amount + actualPayAmount).toFixed(2))
      })
      .eq('id', loanId);

    if (error) {
      console.error('Error updating loan balance:', error.message);
    }

    return tx;
  },

  // --- RUN AUTO PAY SIMULATION ---
  async runAutoPaySimulation(): Promise<void> {
    if (isDemoMode()) {
      MockDatabase.runAutoPaySimulation();
    }
    // In real Supabase, this is handled on the backend via Cron Job + Edge Function,
    // so we don't run it client-side.
  }
};
