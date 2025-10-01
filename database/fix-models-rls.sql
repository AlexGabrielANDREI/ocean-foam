-- Fix RLS policies for models table to allow admin updates
-- This fixes the "Failed to update model" error while keeping RLS enabled

-- Drop existing policies that don't work with wallet headers
DROP POLICY IF EXISTS "Anyone can view active models" ON models;
DROP POLICY IF EXISTS "Admins can view all models" ON models;
DROP POLICY IF EXISTS "Admins can manage models" ON models;

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

-- Create new policies that work with wallet headers
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

CREATE POLICY "models_update_policy" ON models
  FOR UPDATE USING (
    -- Only admins can update models
    is_admin()
  );

CREATE POLICY "models_insert_policy" ON models
  FOR INSERT WITH CHECK (
    -- Only admins can create models
    is_admin()
  );

CREATE POLICY "models_delete_policy" ON models
  FOR DELETE USING (
    -- Only admins can delete models
    is_admin()
  );
