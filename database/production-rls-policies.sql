-- Production RLS Policies for Wallet-Based Authentication
-- Run these commands in your Supabase SQL editor

-- First, enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for wallet authentication" ON users;
DROP POLICY IF EXISTS "Enable update for wallet authentication" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON models;
DROP POLICY IF EXISTS "Enable all access for admins" ON models;
DROP POLICY IF EXISTS "Enable read access for all users" ON predictions;
DROP POLICY IF EXISTS "Enable insert for wallet authentication" ON predictions;

-- Create a function to get current wallet address from request headers
CREATE OR REPLACE FUNCTION get_current_wallet_address()
RETURNS TEXT AS $$
BEGIN
  -- Try to get wallet address from custom header
  RETURN current_setting('request.headers', true)::json->>'x-wallet-address';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE wallet_address = get_current_wallet_address()
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    -- Users can view their own data
    wallet_address = get_current_wallet_address()
    OR
    -- Admins can view all users
    is_admin()
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    -- Allow insertion of new users
    wallet_address = get_current_wallet_address()
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    -- Users can update their own data
    wallet_address = get_current_wallet_address()
    OR
    -- Admins can update any user
    is_admin()
  );

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (
    -- Only admins can delete users
    is_admin()
  );

-- Models table policies
CREATE POLICY "models_select_policy" ON models
  FOR SELECT USING (
    -- Anyone can view active models
    is_active = true
    OR
    -- Admins can view all models
    is_admin()
    OR
    -- Model owners can view their own models
    owner_wallet = get_current_wallet_address()
  );

CREATE POLICY "models_insert_policy" ON models
  FOR INSERT WITH CHECK (
    -- Only admins can create models
    is_admin()
  );

CREATE POLICY "models_update_policy" ON models
  FOR UPDATE USING (
    -- Only admins can update models
    is_admin()
  );

CREATE POLICY "models_delete_policy" ON models
  FOR DELETE USING (
    -- Only admins can delete models
    is_admin()
  );

-- Predictions table policies
CREATE POLICY "predictions_select_policy" ON predictions
  FOR SELECT USING (
    -- Users can view their own predictions
    user_id IN (
      SELECT id FROM users WHERE wallet_address = get_current_wallet_address()
    )
    OR
    -- Admins can view all predictions
    is_admin()
  );

CREATE POLICY "predictions_insert_policy" ON predictions
  FOR INSERT WITH CHECK (
    -- Users can create predictions for themselves
    user_id IN (
      SELECT id FROM users WHERE wallet_address = get_current_wallet_address()
    )
  );

CREATE POLICY "predictions_update_policy" ON predictions
  FOR UPDATE USING (
    -- Only admins can update predictions
    is_admin()
  );

CREATE POLICY "predictions_delete_policy" ON predictions
  FOR DELETE USING (
    -- Only admins can delete predictions
    is_admin()
  ); 