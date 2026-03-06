-- Enable UUID-OSSP extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  business_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy functions for roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Insert profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, commission_percentage, business_name)
  VALUES (
    new.id, 
    'user', 
    0, 
    new.raw_user_meta_data->>'business_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Payments Policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Storage: Receipts bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
