-- Fix RLS policies for eda_access table
-- Run these commands in your Supabase SQL editor

-- First, ensure the get_current_wallet_address function exists
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

-- Drop existing EDA access policies if they exist
DROP POLICY IF EXISTS "Users can view own EDA access" ON eda_access;
DROP POLICY IF EXISTS "Users can insert own EDA access" ON eda_access;

-- Create new EDA access policies using the same pattern as predictions
CREATE POLICY "eda_access_select_policy" ON eda_access
  FOR SELECT USING (
    -- Users can view their own EDA access records
    user_id IN (
      SELECT id FROM users WHERE wallet_address = get_current_wallet_address()
    )
    OR
    -- Admins can view all EDA access records
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = get_current_wallet_address()
      AND role = 'admin'
    )
  );

CREATE POLICY "eda_access_insert_policy" ON eda_access
  FOR INSERT WITH CHECK (
    -- Users can create EDA access records for themselves
    user_id IN (
      SELECT id FROM users WHERE wallet_address = get_current_wallet_address()
    )
  );

CREATE POLICY "eda_access_update_policy" ON eda_access
  FOR UPDATE USING (
    -- Only admins can update EDA access records
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = get_current_wallet_address()
      AND role = 'admin'
    )
  );

CREATE POLICY "eda_access_delete_policy" ON eda_access
  FOR DELETE USING (
    -- Only admins can delete EDA access records
    EXISTS (
      SELECT 1 FROM users 
      WHERE wallet_address = get_current_wallet_address()
      AND role = 'admin'
    )
  );
