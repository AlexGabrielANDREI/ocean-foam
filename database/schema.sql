-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    wallet_type VARCHAR(50) NOT NULL CHECK (wallet_type IN ('metamask', 'hedera')),
    role VARCHAR(50) NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    model_hash VARCHAR(255) NOT NULL UNIQUE,
    model_path VARCHAR(500) NOT NULL,
    owner_wallet VARCHAR(255) NOT NULL,
    nft_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    prediction_result VARCHAR(255) NOT NULL,
    prediction_score DECIMAL(5,4) NOT NULL,
    features_used VARCHAR(50) NOT NULL CHECK (features_used IN ('manual', 'api')),
    features_data JSONB,
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EDA Access table
CREATE TABLE eda_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_models_hash ON models(model_hash);
CREATE INDEX idx_models_active ON models(is_active);
CREATE INDEX idx_models_owner ON models(owner_wallet);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
CREATE INDEX idx_eda_access_user_id ON eda_access(user_id);
CREATE INDEX idx_eda_access_created_at ON eda_access(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (replace with actual wallet address)
-- INSERT INTO users (wallet_address, wallet_type, role) 
-- VALUES ('0x0000000000000000000000000000000000000000', 'metamask', 'admin');

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eda_access ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (wallet_address = current_setting('app.wallet_address', true));

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (wallet_address = current_setting('app.wallet_address', true));

-- Anyone can view active models
CREATE POLICY "Anyone can view active models" ON models
    FOR SELECT USING (is_active = true);

-- Only admins can view all models
CREATE POLICY "Admins can view all models" ON models
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true) 
            AND role = 'admin'
        )
    );

-- Only admins can insert/update models
CREATE POLICY "Admins can manage models" ON models
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true) 
            AND role = 'admin'
        )
    );

-- Users can view their own predictions
CREATE POLICY "Users can view own predictions" ON predictions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true)
        )
    );

-- Users can insert their own predictions
CREATE POLICY "Users can insert own predictions" ON predictions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE wallet_address = current_setting('app.wallet_address', true)
        )
    );

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