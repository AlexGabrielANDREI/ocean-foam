-- Test EDA Access table and RLS policies
-- Run these commands in your Supabase SQL editor to debug

-- 1. Check if the get_current_wallet_address function exists
SELECT get_current_wallet_address();

-- 2. Check if the eda_access table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'eda_access' 
ORDER BY ordinal_position;

-- 3. Check RLS policies on eda_access table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'eda_access';

-- 4. Check if RLS is enabled on eda_access table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'eda_access';

-- 5. Try to insert a test record (this should fail due to RLS)
-- Replace 'test-user-id' with an actual user ID from your users table
-- INSERT INTO eda_access (user_id, transaction_hash) 
-- VALUES ('test-user-id', 'test-hash-123');

-- 6. Check if there are any users in the users table
SELECT id, wallet_address FROM users LIMIT 5;

-- 7. Check if the function can read headers (this will return null in SQL editor)
SELECT current_setting('request.headers', true);
