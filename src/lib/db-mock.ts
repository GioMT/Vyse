// Client-side localStorage Mock Database for Personal Finance Tracker
// This allows the app to be fully functional immediately without a live Supabase database.

// Reversible base64 encoding/decryption for mock storage
export const obfuscate = (str: string): string => {
  if (!str) return '';
  try {
    return btoa(str);
  } catch {
    return str;
  }
};

export const deobfuscate = (str: string): string => {
  if (!str) return '';
  try {
    return atob(str);
  } catch {
    return str;
  }
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  dob?: string;
  sex?: string;
  onboarded?: boolean;
  currency?: string;
  is_oauth?: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  balance: number;
  color: string; // HSL color or tailwind class for dashboard aesthetics
  account_number?: string;
  created_at: string;
  connection_id?: string;
  is_linked?: boolean;
}

export interface Category {
  id: string;
  user_id: string; // null for default categories, string for custom
  name: string;
  type: 'income' | 'expense';
  color: string; // Accent color
  icon: string; // Lucide icon name
}

export interface BankConnection {
  id: string;
  user_id: string;
  institution_name: string;
  logo_url?: string;
  status: 'active' | 'error' | 'syncing';
  last_synced_at: string;
  accounts_count: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string; // YYYY-MM-DD
  created_at: string;
  ai_metadata?: {
    clean_merchant?: string;
    confidence?: number;
    is_ai_categorized?: boolean;
    method?: 'simulated' | 'gemini';
  };
}

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category_id: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  next_due_date: string; // YYYY-MM-DD
  status: 'paid' | 'unpaid' | 'overdue';
  auto_pay: boolean;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  principal: number;
  interest_rate: number; // percentage, e.g. 4.5
  term_months: number;
  monthly_payment: number;
  payment_frequency: 'monthly' | 'bi-monthly'; // monthly = 1x/mo, bi-monthly = 2x/mo
  first_payment_day?: number;  // day of month for 1st payment (1-28)
  second_payment_day?: number; // day of month for 2nd payment (bi-monthly only)
  remaining_balance: number;
  paid_amount: number;
  start_date: string; // YYYY-MM-DD
  created_at: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-inc-salary', user_id: '', name: 'Salary', type: 'income', color: 'emerald', icon: 'Briefcase' },
  { id: 'cat-inc-freelance', user_id: '', name: 'Freelance & Side Hustles', type: 'income', color: 'teal', icon: 'Laptop' },
  { id: 'cat-inc-invest', user_id: '', name: 'Investments', type: 'income', color: 'indigo', icon: 'TrendingUp' },
  { id: 'cat-inc-other', user_id: '', name: 'Other Income', type: 'income', color: 'cyan', icon: 'PlusCircle' },
  // Expense
  { id: 'cat-exp-housing', user_id: '', name: 'Housing & Rent', type: 'expense', color: 'rose', icon: 'Home' },
  { id: 'cat-exp-groceries', user_id: '', name: 'Groceries', type: 'expense', color: 'amber', icon: 'ShoppingBag' },
  { id: 'cat-exp-dining', user_id: '', name: 'Dining & Drinks', type: 'expense', color: 'orange', icon: 'Utensils' },
  { id: 'cat-exp-utilities', user_id: '', name: 'Utilities', type: 'expense', color: 'blue', icon: 'Zap' },
  { id: 'cat-exp-transport', user_id: '', name: 'Transportation', type: 'expense', color: 'purple', icon: 'Car' },
  { id: 'cat-exp-ent', user_id: '', name: 'Entertainment & Leisure', type: 'expense', color: 'pink', icon: 'Film' },
  { id: 'cat-exp-sub', user_id: '', name: 'Subscriptions', type: 'expense', color: 'violet', icon: 'CreditCard' },
  { id: 'cat-exp-other', user_id: '', name: 'Other Expense', type: 'expense', color: 'zinc', icon: 'HelpCircle' },
];

export const DEFAULT_ACCOUNTS = (userId: string): Account[] => [
  { id: 'acc-checking', user_id: userId, name: 'Chase Checking', type: 'checking', balance: 5420.50, color: 'blue', created_at: new Date().toISOString() },
  { id: 'acc-savings', user_id: userId, name: 'Marcus Savings (5.0% APY)', type: 'savings', balance: 24500.00, color: 'emerald', created_at: new Date().toISOString() },
  { id: 'acc-credit', user_id: userId, name: 'Amex Gold', type: 'credit', balance: -850.20, color: 'amber', created_at: new Date().toISOString() },
  { id: 'acc-cash', user_id: userId, name: 'Cash on Hand', type: 'cash', balance: 350.00, color: 'zinc', created_at: new Date().toISOString() },
];

export const DEFAULT_LOANS = (userId: string): Loan[] => [
  {
    id: 'loan-car',
    user_id: userId,
    name: 'Tesla Model Y Auto Loan',
    principal: 45000,
    interest_rate: 4.8,
    term_months: 60,
    monthly_payment: 845.00,
    payment_frequency: 'monthly',
    first_payment_day: 1,
    remaining_balance: 24350.00,
    paid_amount: 20650.00,
    start_date: '2024-06-01',
    created_at: new Date().toISOString()
  },
  {
    id: 'loan-student',
    user_id: userId,
    name: 'Sallie Mae Student Loan',
    principal: 30000,
    interest_rate: 3.5,
    term_months: 120,
    monthly_payment: 298.00,
    payment_frequency: 'bi-monthly',
    first_payment_day: 5,
    second_payment_day: 20,
    remaining_balance: 18400.00,
    paid_amount: 11600.00,
    start_date: '2022-09-01',
    created_at: new Date().toISOString()
  }
];

export const DEFAULT_BILLS = (userId: string): RecurringBill[] => [
  { id: 'bill-rent', user_id: userId, name: 'Monthly Rent', amount: 1800.00, category_id: 'cat-exp-housing', frequency: 'monthly', next_due_date: getFutureDate(1), status: 'unpaid', auto_pay: true, created_at: new Date().toISOString() },
  { id: 'bill-electric', user_id: userId, name: 'Electric Bill (ConEd)', amount: 112.50, category_id: 'cat-exp-utilities', frequency: 'monthly', next_due_date: getFutureDate(10), status: 'unpaid', auto_pay: false, created_at: new Date().toISOString() },
  { id: 'bill-netflix', user_id: userId, name: 'Netflix Premium', amount: 22.99, category_id: 'cat-exp-sub', frequency: 'monthly', next_due_date: getFutureDate(14), status: 'unpaid', auto_pay: true, created_at: new Date().toISOString() },
  { id: 'bill-gym', user_id: userId, name: 'Equinox Gym', amount: 250.00, category_id: 'cat-exp-ent', frequency: 'monthly', next_due_date: getFutureDate(18), status: 'unpaid', auto_pay: true, created_at: new Date().toISOString() }
];

function getFutureDate(dayOfMonth: number): string {
  const d = new Date();
  let m = d.getMonth();
  let y = d.getFullYear();
  if (d.getDate() >= dayOfMonth) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
  return dateStr;
}

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (daysAgo % 8), 15 + (daysAgo % 4) * 10);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export const DEFAULT_TRANSACTIONS = (userId: string): Transaction[] => [
  { id: 'tx-1', user_id: userId, account_id: 'acc-checking', category_id: 'cat-inc-salary', amount: 2650.00, type: 'income', description: 'Bi-Weekly Salary Google', date: getPastDate(3), created_at: new Date().toISOString() },
  { id: 'tx-2', user_id: userId, account_id: 'acc-checking', category_id: 'cat-exp-housing', amount: 1800.00, type: 'expense', description: 'Monthly Rent', date: getPastDate(3), created_at: new Date().toISOString() },
  { id: 'tx-3', user_id: userId, account_id: 'acc-checking', category_id: 'cat-inc-salary', amount: 2650.00, type: 'income', description: 'Bi-Weekly Salary Google', date: getPastDate(17), created_at: new Date().toISOString() },
  { id: 'tx-4', user_id: userId, account_id: 'acc-checking', category_id: 'cat-inc-freelance', amount: 1200.00, type: 'income', description: 'Freelance UI Design Contract', date: getPastDate(10), created_at: new Date().toISOString() },
  { id: 'tx-5', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-groceries', amount: 145.20, type: 'expense', description: 'Whole Foods Market', date: getPastDate(1), created_at: new Date().toISOString() },
  { id: 'tx-6', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-dining', amount: 82.50, type: 'expense', description: 'Sushi dinner with friends', date: getPastDate(2), created_at: new Date().toISOString() },
  { id: 'tx-7', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-sub', amount: 14.99, type: 'expense', description: 'Spotify Premium Duo', date: getPastDate(8), created_at: new Date().toISOString() },
  { id: 'tx-8', user_id: userId, account_id: 'acc-checking', category_id: 'cat-exp-utilities', amount: 98.40, type: 'expense', description: 'Internet (Fios)', date: getPastDate(12), created_at: new Date().toISOString() },
  { id: 'tx-9', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-transport', amount: 45.00, type: 'expense', description: 'Uber rides', date: getPastDate(5), created_at: new Date().toISOString() },
  { id: 'tx-10', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-dining', amount: 6.80, type: 'expense', description: 'Starbucks Latte', date: getPastDate(4), created_at: new Date().toISOString() },
  { id: 'tx-11', user_id: userId, account_id: 'acc-savings', category_id: 'cat-inc-invest', amount: 105.00, type: 'income', description: 'Dividends Payoff', date: getPastDate(15), created_at: new Date().toISOString() },
  { id: 'tx-12', user_id: userId, account_id: 'acc-credit', category_id: 'cat-exp-groceries', amount: 62.40, type: 'expense', description: 'Trader Joes', date: getPastDate(16), created_at: new Date().toISOString() },
  { id: 'tx-13', user_id: userId, account_id: 'acc-checking', category_id: 'cat-exp-transport', amount: 280.00, type: 'expense', description: 'Tesla Auto Loan Payment', date: getPastDate(20), created_at: new Date().toISOString() },
];

export class MockDatabase {
  private static getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private static setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  static getSessionUser(): Profile | null {
    return this.getStorageItem<Profile | null>('pt_session_user', null);
  }

  static setSessionUser(user: Profile | null): void {
    this.setStorageItem('pt_session_user', user);
    if (user) {
      // Initialize other database stores for this user if empty
      this.initUserStores(user.id);
    }
  }

  // --- USER AUTH REGISTRY ---
  static getMockUsers(): Array<Profile & { password?: string }> {
    const defaultUser: Profile & { password?: string } = {
      id: 'demo-user-id',
      email: 'demo@finance.io',
      password: 'password',
      full_name: 'Alex Mercer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      onboarded: true,
      created_at: new Date('2026-06-03T21:14:15Z').toISOString()
    };
    const list = this.getStorageItem<Array<Profile & { password?: string }>>('pt_mock_users', []);
    if (list.length === 0) {
      this.setStorageItem('pt_mock_users', [defaultUser]);
      return [defaultUser];
    }
    // Check if the defaultUser is present in the list, if not add it back
    if (!list.some(u => u.email === defaultUser.email)) {
      list.push(defaultUser);
      this.setStorageItem('pt_mock_users', list);
    }
    return list;
  }

  static checkEmailExists(email: string): boolean {
    const users = this.getMockUsers();
    const cleanEmail = email.toLowerCase().trim();
    return users.some(u => u.email.toLowerCase().trim() === cleanEmail);
  }

  static createMockUser(email: string, password: string, fullName: string, dob?: string, sex?: string): Profile | null {
    const users = this.getMockUsers();
    const cleanEmail = email.toLowerCase().trim();
    if (users.some(u => u.email.toLowerCase().trim() === cleanEmail)) {
      return null; // Already exists
    }

    const newUser: Profile & { password?: string } = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      password: password,
      full_name: fullName,
      dob: dob,
      sex: sex,
      onboarded: false,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this.setStorageItem('pt_mock_users', users);
    
    // Automatically set as active user session
    this.setSessionUser(newUser);
    return newUser;
  }

  static verifyMockUser(email: string, password: string): Profile | null {
    const users = this.getMockUsers();
    const cleanEmail = email.toLowerCase().trim();
    const match = users.find(u => u.email.toLowerCase().trim() === cleanEmail && u.password === password);
    if (match) {
      // Return profile without the password field
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...profile } = match;
      this.setSessionUser(profile);
      return profile;
    }
    return null;
  }

  static updateProfile(fullName: string, dob: string, sex: string, onboarded?: boolean, currency?: string): Profile | null {
    const user = this.getSessionUser();
    if (!user) return null;
    
    const users = this.getMockUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        full_name: fullName,
        dob,
        sex,
        onboarded: onboarded !== undefined ? onboarded : users[idx].onboarded,
        currency: currency !== undefined ? currency : users[idx].currency
      };
      this.setStorageItem('pt_mock_users', users);
    }
    
    const updated = {
      ...user,
      full_name: fullName,
      dob,
      sex,
      onboarded: onboarded !== undefined ? onboarded : user.onboarded,
      currency: currency !== undefined ? currency : user.currency
    };
    this.setSessionUser(updated);
    return updated;
  }

  static verifyCurrentPassword(password: string): boolean {
    const user = this.getSessionUser();
    if (!user) return false;
    const users = this.getMockUsers();
    const match = users.find(u => u.id === user.id);
    return match ? match.password === password : false;
  }

  static updateEmail(newEmail: string): boolean {
    const user = this.getSessionUser();
    if (!user) return false;
    
    const users = this.getMockUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        email: newEmail.toLowerCase().trim()
      };
      this.setStorageItem('pt_mock_users', users);
    }
    
    const updated = {
      ...user,
      email: newEmail.toLowerCase().trim()
    };
    this.setSessionUser(updated);
    return true;
  }

  static updatePassword(newPassword: string): boolean {
    const user = this.getSessionUser();
    if (!user) return false;
    
    const users = this.getMockUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        password: newPassword
      };
      this.setStorageItem('pt_mock_users', users);
      return true;
    }
    return false;
  }

  private static initUserStores(userId: string) {
    const accs = this.getStorageItem<Account[]>(`pt_accounts_${userId}`, []);
    if (accs.length === 0) {
      if (userId === 'demo-user-id') {
        this.setStorageItem(`pt_accounts_${userId}`, DEFAULT_ACCOUNTS(userId));
        this.setStorageItem(`pt_transactions_${userId}`, DEFAULT_TRANSACTIONS(userId));
        this.setStorageItem(`pt_bills_${userId}`, DEFAULT_BILLS(userId));
        this.setStorageItem(`pt_loans_${userId}`, DEFAULT_LOANS(userId));
      } else {
        this.setStorageItem(`pt_accounts_${userId}`, []);
        this.setStorageItem(`pt_transactions_${userId}`, []);
        this.setStorageItem(`pt_bills_${userId}`, []);
        this.setStorageItem(`pt_loans_${userId}`, []);
      }
    }
  }

  // General state queries for current user
  private static getUserId(): string {
    const user = this.getSessionUser();
    return user ? user.id : 'demo-user-id';
  }

  // --- ACCOUNTS ---
  static getAccounts(): Account[] {
    const uid = this.getUserId();
    this.initUserStores(uid);
    return this.getStorageItem<Account[]>(`pt_accounts_${uid}`, []);
  }

  static saveAccounts(accounts: Account[]) {
    const uid = this.getUserId();
    this.setStorageItem(`pt_accounts_${uid}`, accounts);
  }

  static createAccount(name: string, type: Account['type'], initialBalance: number, color: string, accountNumber?: string): Account {
    const accounts = this.getAccounts();
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      user_id: this.getUserId(),
      name,
      type,
      balance: type === 'credit' ? -Math.abs(initialBalance) : Math.abs(initialBalance),
      color,
      account_number: accountNumber ? obfuscate(accountNumber) : '',
      created_at: new Date().toISOString()
    };
    accounts.push(newAcc);
    this.saveAccounts(accounts);
    return newAcc;
  }

  static updateAccount(id: string, name: string, type: Account['type'], balance: number, color: string, accountNumber?: string): boolean {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) return false;
    accounts[idx] = {
      ...accounts[idx],
      name,
      type,
      balance,
      color,
      account_number: accountNumber !== undefined ? (accountNumber ? obfuscate(accountNumber) : '') : accounts[idx].account_number
    };
    this.saveAccounts(accounts);
    return true;
  }

  // --- CATEGORIES ---
  static getCategories(): Category[] {
    const custom = this.getStorageItem<Category[]>(`pt_categories_custom_${this.getUserId()}`, []);
    return [...DEFAULT_CATEGORIES, ...custom];
  }

  static createCategory(name: string, type: 'income' | 'expense', color: string, icon: string): Category {
    const uid = this.getUserId();
    const custom = this.getStorageItem<Category[]>(`pt_categories_custom_${uid}`, []);
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      user_id: uid,
      name,
      type,
      color,
      icon
    };
    custom.push(newCat);
    this.setStorageItem(`pt_categories_custom_${uid}`, custom);
    return newCat;
  }

  // --- TRANSACTIONS ---
  static getTransactions(): Transaction[] {
    const uid = this.getUserId();
    this.initUserStores(uid);
    return this.getStorageItem<Transaction[]>(`pt_transactions_${uid}`, []);
  }

  static saveTransactions(txs: Transaction[]) {
    const uid = this.getUserId();
    this.setStorageItem(`pt_transactions_${uid}`, txs);
  }

  static createTransaction(data: {
    accountId: string;
    categoryId: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }): Transaction {
    const txs = this.getTransactions();
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: this.getUserId(),
      account_id: data.accountId,
      category_id: data.categoryId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date,
      created_at: new Date().toISOString()
    };
    txs.unshift(newTx); // Newest first
    this.saveTransactions(txs);

    // Apply Math to Account Balance
    const accounts = this.getAccounts();
    const accIdx = accounts.findIndex(a => a.id === data.accountId);
    if (accIdx !== -1) {
      const change = data.type === 'income' ? data.amount : -data.amount;
      // Credit card balances are negative when we owe money, so charging an expense decreases it further, receiving income (paying it down) increases it
      accounts[accIdx].balance += change;
      this.saveAccounts(accounts);
    }

    return newTx;
  }

  static deleteTransaction(txId: string) {
    const txs = this.getTransactions();
    const target = txs.find(t => t.id === txId);
    if (!target) return;

    // Reverse the balance impact
    const accounts = this.getAccounts();
    const accIdx = accounts.findIndex(a => a.id === target.account_id);
    if (accIdx !== -1) {
      const change = target.type === 'income' ? -target.amount : target.amount;
      accounts[accIdx].balance += change;
      this.saveAccounts(accounts);
    }

    const filtered = txs.filter(t => t.id !== txId);
    this.saveTransactions(filtered);
  }

  // --- RECURRING BILLS ---
  static getBills(): RecurringBill[] {
    const uid = this.getUserId();
    this.initUserStores(uid);
    return this.getStorageItem<RecurringBill[]>(`pt_bills_${uid}`, []);
  }

  static saveBills(bills: RecurringBill[]) {
    const uid = this.getUserId();
    this.setStorageItem(`pt_bills_${uid}`, bills);
  }

  static createBill(data: {
    name: string;
    amount: number;
    categoryId: string;
    frequency: RecurringBill['frequency'];
    nextDueDate: string;
    autoPay: boolean;
  }): RecurringBill {
    const bills = this.getBills();
    const newBill: RecurringBill = {
      id: `bill-${Date.now()}`,
      user_id: this.getUserId(),
      name: data.name,
      amount: data.amount,
      category_id: data.categoryId,
      frequency: data.frequency,
      next_due_date: data.nextDueDate,
      status: 'unpaid',
      auto_pay: data.autoPay,
      created_at: new Date().toISOString()
    };
    bills.push(newBill);
    this.saveBills(bills);
    return newBill;
  }

  static payBill(billId: string, accountId: string): Transaction | null {
    const bills = this.getBills();
    const billIdx = bills.findIndex(b => b.id === billId);
    if (billIdx === -1) return null;

    const bill = bills[billIdx];

    // Create the transaction
    const tx = this.createTransaction({
      accountId,
      categoryId: bill.category_id,
      amount: bill.amount,
      type: 'expense',
      description: `Payment: ${bill.name}`,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    });

    // Advance next due date
    const d = new Date(bill.next_due_date);
    if (bill.frequency === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (bill.frequency === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else if (bill.frequency === 'yearly') {
      d.setFullYear(d.getFullYear() + 1);
    }

    bills[billIdx].next_due_date = d.toISOString().split('T')[0];
    bills[billIdx].status = 'unpaid'; // resets status for the next cycle
    this.saveBills(bills);

    return tx;
  }

  // --- LOANS ---
  static getLoans(): Loan[] {
    const uid = this.getUserId();
    this.initUserStores(uid);
    return this.getStorageItem<Loan[]>(`pt_loans_${uid}`, []);
  }

  static saveLoans(loans: Loan[]) {
    const uid = this.getUserId();
    this.setStorageItem(`pt_loans_${uid}`, loans);
  }

  static createLoan(data: {
    name: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    paymentFrequency: 'monthly' | 'bi-monthly';
    firstPaymentDay?: number;
    secondPaymentDay?: number;
    startDate: string;
  }): Loan {
    const loans = this.getLoans();
    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      user_id: this.getUserId(),
      name: data.name,
      principal: data.principal,
      interest_rate: data.interestRate,
      term_months: data.termMonths,
      monthly_payment: data.monthlyPayment,
      payment_frequency: data.paymentFrequency,
      first_payment_day: data.firstPaymentDay,
      second_payment_day: data.secondPaymentDay,
      remaining_balance: data.principal,
      paid_amount: 0,
      start_date: data.startDate,
      created_at: new Date().toISOString()
    };
    loans.push(newLoan);
    this.saveLoans(loans);
    return newLoan;
  }

  static makeLoanPayment(loanId: string, accountId: string, amount: number, lateCharge?: number, comment?: string): Transaction | null {
    const loans = this.getLoans();
    const idx = loans.findIndex(l => l.id === loanId);
    if (idx === -1) return null;

    const loan = loans[idx];
    const actualPayAmount = Math.min(amount, loan.remaining_balance);
    if (actualPayAmount <= 0) return null;

    // Create the transaction
    const tx = this.createTransaction({
      accountId,
      categoryId: 'cat-exp-utilities', // Default utilities/debts
      amount: actualPayAmount,
      type: 'expense',
      description: `Loan Payment: ${loan.name}`,
      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    });

    // Deduct from loan balance
    loans[idx].remaining_balance = parseFloat((loan.remaining_balance - actualPayAmount).toFixed(2));
    loans[idx].paid_amount = parseFloat((loan.paid_amount + actualPayAmount).toFixed(2));
    this.saveLoans(loans);

    // Create separate transaction for late charges if applicable
    if (lateCharge && lateCharge > 0) {
      this.createTransaction({
        accountId,
        categoryId: 'cat-exp-other',
        amount: lateCharge,
        type: 'expense',
        description: `Loan Additional Charge (${comment || 'Late Fee/Processing'}): ${loan.name}`,
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      });
    }

    return tx;
  }

  // --- SIMULATION ON LOAD ---
  // Scans for auto-pay bills that are past due and auto-pays them
  static runAutoPaySimulation() {
    const bills = this.getBills();
    const today = new Date().toISOString().split('T')[0];
    const accounts = this.getAccounts();
    const payAccount = accounts.find(a => a.type === 'checking') || accounts[0];

    if (!payAccount) return;

    for (const bill of bills) {
      if (bill.auto_pay && bill.next_due_date <= today) {
        // Pay the bill automatically
        this.payBill(bill.id, payAccount.id);
      }
    }
  }

  // --- BANK CONNECTIONS ---
  static getBankConnections(): BankConnection[] {
    const uid = this.getUserId();
    return this.getStorageItem<BankConnection[]>(`pt_bank_connections_${uid}`, []);
  }

  static saveBankConnections(connections: BankConnection[]) {
    const uid = this.getUserId();
    this.setStorageItem(`pt_bank_connections_${uid}`, connections);
  }

  static linkMockBankConnection(
    institutionName: string, 
    accountsData: Array<{ name: string; balance: number; type: Account['type'] }>
  ): BankConnection {
    const uid = this.getUserId();
    const connections = this.getBankConnections();
    
    // Create new bank connection object
    const newConn: BankConnection = {
      id: `conn-${Date.now()}`,
      user_id: uid,
      institution_name: institutionName,
      status: 'active',
      last_synced_at: new Date().toISOString(),
      accounts_count: accountsData.length,
      created_at: new Date().toISOString()
    };
    
    connections.push(newConn);
    this.saveBankConnections(connections);

    // Create the accounts and populate with initial mock transactions
    const accounts = this.getAccounts();
    const txs = this.getTransactions();

    accountsData.forEach((accData, i) => {
      const newAccId = `acc-linked-${Date.now()}-${i}`;
      const newAcc: Account = {
        id: newAccId,
        user_id: uid,
        name: accData.name,
        type: accData.type,
        balance: accData.type === 'credit' ? -Math.abs(accData.balance) : Math.abs(accData.balance),
        color: institutionName.toLowerCase().includes('chase') ? 'blue' : 
               institutionName.toLowerCase().includes('amex') ? 'amber' : 
               institutionName.toLowerCase().includes('wells') ? 'rose' : 'emerald',
        account_number: obfuscate(Math.floor(1000 + Math.random() * 9000).toString()),
        connection_id: newConn.id,
        is_linked: true,
        created_at: new Date().toISOString()
      };
      
      accounts.push(newAcc);

      // Create initial simulated pending/past transactions for this account
      const mockTxPool = [
        { desc: 'TST* BLUE BOTTLE COFFEE SAN FRANCISCO CA', amount: 5.75, type: 'expense' as const, catId: 'cat-exp-dining' },
        { desc: 'UBER * TRIP HELP.UBER.COM', amount: 24.50, type: 'expense' as const, catId: 'cat-exp-transport' },
        { desc: 'NETFLIX.COM* 866-569-7530 CA', amount: 22.99, type: 'expense' as const, catId: 'cat-exp-sub' },
        { desc: 'WHOLEFOODS.COM * 10243 SF CA', amount: 68.42, type: 'expense' as const, catId: 'cat-exp-groceries' },
        { desc: 'PAYROLL DEPOSIT * VALK HORIZON VENTURES', amount: 3200.00, type: 'income' as const, catId: 'cat-inc-salary' }
      ];

      // Add 2-3 random ones from the pool
      const count = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < count; j++) {
        const item = mockTxPool[j % mockTxPool.length];
        // Calculate a random date in the last 5 days
        const daysAgo = j + 1;
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        
        const tx: Transaction = {
          id: `tx-linked-${Date.now()}-${i}-${j}`,
          user_id: uid,
          account_id: newAccId,
          category_id: item.catId,
          amount: item.amount,
          type: item.type,
          description: item.desc,
          date: d.toISOString().slice(0, 16),
          created_at: new Date().toISOString(),
          ai_metadata: {
            clean_merchant: item.desc.split('*')[1]?.trim() || item.desc.split(' ')[0]?.trim(),
            confidence: 0.95,
            is_ai_categorized: true,
            method: 'simulated'
          }
        };
        txs.unshift(tx);
      }
    });

    this.saveAccounts(accounts);
    this.saveTransactions(txs);

    return newConn;
  }

  static syncMockBankConnection(connectionId: string): Promise<number> {
    const connections = this.getBankConnections();
    const connIdx = connections.findIndex(c => c.id === connectionId);
    if (connIdx === -1) return Promise.resolve(0);

    connections[connIdx].status = 'syncing';
    this.saveBankConnections(connections);

    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedConns = this.getBankConnections();
        const idx = updatedConns.findIndex(c => c.id === connectionId);
        if (idx !== -1) {
          updatedConns[idx].status = 'active';
          updatedConns[idx].last_synced_at = new Date().toISOString();
          this.saveBankConnections(updatedConns);
        }

        // Get accounts associated with this connection
        const accounts = this.getAccounts();
        const linkedAccounts = accounts.filter(a => a.connection_id === connectionId);
        
        if (linkedAccounts.length === 0) {
          resolve(0);
          return;
        }

        const txs = this.getTransactions();
        let syncedCount = 0;

        // Choose a random account to add 1 new recent transaction
        const targetAcc = linkedAccounts[Math.floor(Math.random() * linkedAccounts.length)];
        
        const syncPool: Array<{ desc: string; amount: number; type: 'income' | 'expense'; catId: string }> = [
          { desc: 'AMZN Mktp US*HJ9A3', amount: 45.12, type: 'expense', catId: 'cat-exp-groceries' },
          { desc: 'CONEDISON * ELECTRICITY PAY', amount: 115.80, type: 'expense', catId: 'cat-exp-utilities' },
          { desc: 'STARBUCKS COFFEE COFFEE SHOP', amount: 7.25, type: 'expense', catId: 'cat-exp-dining' },
          { desc: 'STRIPE REFUND * GITHUB SPONSOR', amount: 15.00, type: 'income', catId: 'cat-inc-other' }
        ];

        const item = syncPool[Math.floor(Math.random() * syncPool.length)];
        
        // Adjust balance
        const accIdx = accounts.findIndex(a => a.id === targetAcc.id);
        if (accIdx !== -1) {
          const change = item.type === 'income' ? item.amount : -item.amount;
          accounts[accIdx].balance += change;
          this.saveAccounts(accounts);
        }

        const newTx: Transaction = {
          id: `tx-sync-${Date.now()}`,
          user_id: this.getUserId(),
          account_id: targetAcc.id,
          category_id: 'cat-exp-other', // Mark uncategorized initially for AI simulation
          amount: item.amount,
          type: item.type,
          description: item.desc,
          date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
          created_at: new Date().toISOString()
        };

        // Note: We don't categorize yet, let the store sync and run AI categorizer if requested.
        txs.unshift(newTx);
        this.saveTransactions(txs);
        syncedCount = 1;

        resolve(syncedCount);
      }, 1200); // simulate network latency
    });
  }

  static updateTransactionCategory(txId: string, categoryId: string, aiMetadata?: Transaction['ai_metadata']): boolean {
    const txs = this.getTransactions();
    const idx = txs.findIndex(t => t.id === txId);
    if (idx === -1) return false;
    
    txs[idx] = {
      ...txs[idx],
      category_id: categoryId,
      ai_metadata: aiMetadata !== undefined ? aiMetadata : txs[idx].ai_metadata
    };
    this.saveTransactions(txs);
    return true;
  }
}
