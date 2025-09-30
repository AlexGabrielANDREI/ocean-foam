-- Add EDA Access table for tracking EDA payment transactions
-- This migration adds the eda_access table to track EDA report access payments

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

-- Users can view their own EDA access records
CREATE POLICY "Users can view own EDA access" ON eda_access
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true)
        )
    );

-- Users can insert their own EDA access records
CREATE POLICY "Users can insert own EDA access" ON eda_access
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true)
        )
    );
