-- Create EDA Access table for tracking EDA payment transactions
-- Run this in your Supabase SQL editor

-- EDA Access table
CREATE TABLE eda_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_eda_access_user_id ON eda_access(user_id);
CREATE INDEX idx_eda_access_created_at ON eda_access(created_at);

-- Enable Row Level Security
ALTER TABLE eda_access ENABLE ROW LEVEL SECURITY;

-- Create function to get current wallet address from headers
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

-- Users can view their own EDA access records
CREATE POLICY "Users can view own EDA access" ON eda_access
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = get_current_wallet_address()
        )
    );

-- Users can insert their own EDA access records
CREATE POLICY "Users can insert own EDA access" ON eda_access
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = get_current_wallet_address()
        )
    );
