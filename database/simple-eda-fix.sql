-- Simple fix for EDA access table - disable RLS completely for now
-- Run these commands in your Supabase SQL editor

-- 1. Disable RLS completely on eda_access table
ALTER TABLE public.eda_access DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own EDA access" ON public.eda_access;
DROP POLICY IF EXISTS "Users can insert own EDA access" ON public.eda_access;
DROP POLICY IF EXISTS "Allow all operations on eda_access" ON public.eda_access;

-- 3. Test insert (get a user ID first)
SELECT id, wallet_address FROM users LIMIT 1;

-- 4. Test insert (replace 'your-user-id-here' with actual ID from step 3)
INSERT INTO public.eda_access (user_id, transaction_hash) 
VALUES ('your-user-id-here', 'test-hash-123');

-- 5. Check if it worked
SELECT * FROM public.eda_access;

-- 6. Clean up test data
-- DELETE FROM public.eda_access WHERE transaction_hash = 'test-hash-123';
