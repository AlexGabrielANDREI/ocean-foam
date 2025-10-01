-- Temporarily disable RLS on eda_access table for testing
-- Run this in your Supabase SQL editor

-- Disable RLS temporarily
ALTER TABLE public.eda_access DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own EDA access" ON public.eda_access;
DROP POLICY IF EXISTS "Users can insert own EDA access" ON public.eda_access;

-- Test insert (replace with actual user ID from your users table)
-- INSERT INTO public.eda_access (user_id, transaction_hash) 
-- VALUES ('your-user-id-here', 'test-hash-123');

-- Check if the insert worked
-- SELECT * FROM public.eda_access;

-- Re-enable RLS after testing
-- ALTER TABLE public.eda_access ENABLE ROW LEVEL SECURITY;
