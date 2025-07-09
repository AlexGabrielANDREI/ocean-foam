-- Fix RLS policies for wallet-based authentication
-- Run these commands in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Anyone can view active models" ON models;
DROP POLICY IF EXISTS "Admins can manage all models" ON models;
DROP POLICY IF EXISTS "Users can view their own predictions" ON predictions;
DROP POLICY IF EXISTS "Admins can view all predictions" ON predictions;

-- Create new policies for wallet-based auth
-- Users table policies
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for wallet authentication" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for wallet authentication" ON users
  FOR UPDATE USING (true);

-- Models table policies  
CREATE POLICY "Enable read access for all users" ON models
  FOR SELECT USING (true);

CREATE POLICY "Enable all access for admins" ON models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND users.role = 'admin'
    )
  );

-- Predictions table policies
CREATE POLICY "Enable read access for all users" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for wallet authentication" ON predictions
  FOR INSERT WITH CHECK (true);

-- Alternative approach: Disable RLS for now (for testing)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE models DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions DISABLE ROW LEVEL SECURITY; 