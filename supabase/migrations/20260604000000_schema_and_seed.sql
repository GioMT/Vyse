-- Personal Finance Tracker - Supabase Initial Schema & Seeds
-- To be run in the Supabase SQL Editor or via Supabase CLI migrations.

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create Core Tables

-- Profiles Table (Linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Accounts Table
create table public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit', 'cash')),
  balance numeric(12,2) default 0.00 not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories Table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade, -- null user_id means global default category
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null
);

-- Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references public.accounts on delete cascade not null,
  category_id uuid references public.categories on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  description text,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recurring Bills Table
create table public.recurring_bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid references public.categories on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_due_date date not null,
  auto_pay boolean default false not null,
  status text default 'unpaid' not null check (status in ('paid', 'unpaid', 'overdue')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Loans Table
create table public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  principal numeric(12,2) not null check (principal > 0),
  interest_rate numeric(5,2) not null check (interest_rate >= 0),
  term_months integer not null check (term_months > 0),
  monthly_payment numeric(12,2) not null check (monthly_payment >= 0),
  remaining_balance numeric(12,2) not null check (remaining_balance >= 0),
  paid_amount numeric(12,2) default 0.00 not null check (paid_amount >= 0),
  start_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Configure Row Level Security (RLS)

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.loans enable row level security;

-- Profiles policies
create policy "Allow public read of profiles" on public.profiles for select using (true);
create policy "Allow individual update of own profile" on public.profiles for update using (auth.uid() = id);

-- Accounts policies
create policy "Allow individual access to own accounts" on public.accounts for all using (auth.uid() = user_id);

-- Categories policies
create policy "Allow read of default and own categories" on public.categories for select using (user_id is null or auth.uid() = user_id);
create policy "Allow write of own categories" on public.categories for all using (auth.uid() = user_id);

-- Transactions policies
create policy "Allow individual access to own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Recurring Bills policies
create policy "Allow individual access to own bills" on public.recurring_bills for all using (auth.uid() = user_id);

-- Loans policies
create policy "Allow individual access to own loans" on public.loans for all using (auth.uid() = user_id);

-- 3. Triggers for Balance Calculations and Profile Scaffolding

-- A. Update Account Balance automatically on Transaction insert/update/delete
create or replace function public.handle_transaction_balance_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (new.type = 'income') then
      update public.accounts set balance = balance + new.amount where id = new.account_id;
    else
      update public.accounts set balance = balance - new.amount where id = new.account_id;
    end if;
  elsif (TG_OP = 'DELETE') then
    if (old.type = 'income') then
      update public.accounts set balance = balance - old.amount where id = old.account_id;
    else
      update public.accounts set balance = balance + old.amount where id = old.account_id;
    end if;
  elsif (TG_OP = 'UPDATE') then
    -- Reverse old balance change
    if (old.type = 'income') then
      update public.accounts set balance = balance - old.amount where id = old.account_id;
    else
      update public.accounts set balance = balance + old.amount where id = old.account_id;
    end if;
    -- Apply new balance change
    if (new.type = 'income') then
      update public.accounts set balance = balance + new.amount where id = new.account_id;
    else
      update public.accounts set balance = balance - new.amount where id = new.account_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger transaction_balance_change_trigger
after insert or update or delete on public.transactions
for each row execute function public.handle_transaction_balance_change();


-- B. Auto-create Profile and Default Accounts on user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Finance User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default checking and savings accounts for the user
  insert into public.accounts (user_id, name, type, balance, color)
  values 
    (new.id, 'Main Checking', 'checking', 0.00, 'blue'),
    (new.id, 'Savings Account', 'savings', 0.00, 'emerald');

  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- 4. Seed Global Default Categories (user_id is NULL)

insert into public.categories (name, type, color, icon)
values
  ('Salary', 'income', 'emerald', 'Briefcase'),
  ('Freelance & Side Hustles', 'income', 'teal', 'Laptop'),
  ('Investments', 'income', 'indigo', 'TrendingUp'),
  ('Other Income', 'income', 'cyan', 'PlusCircle'),
  ('Housing & Rent', 'expense', 'rose', 'Home'),
  ('Groceries', 'expense', 'amber', 'ShoppingBag'),
  ('Dining & Drinks', 'expense', 'orange', 'Utensils'),
  ('Utilities', 'expense', 'blue', 'Zap'),
  ('Transportation', 'expense', 'purple', 'Car'),
  ('Entertainment & Leisure', 'expense', 'pink', 'Film'),
  ('Subscriptions', 'expense', 'violet', 'CreditCard'),
  ('Other Expense', 'expense', 'zinc', 'HelpCircle');
