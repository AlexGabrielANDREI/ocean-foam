-- Add missing columns to models table for features support
-- This migration adds the features_path and use_manual_features columns

-- Add features_path column (nullable TEXT)
ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;

-- Add use_manual_features column (BOOLEAN with default false)
ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;

-- Add activated_at column for tracking when models are activated
ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Create index for features_path for better query performance
CREATE INDEX IF NOT EXISTS idx_models_features_path ON models(features_path);

-- Create index for use_manual_features for filtering
CREATE INDEX IF NOT EXISTS idx_models_use_manual_features ON models(use_manual_features);

-- Update existing models to have use_manual_features = false by default
UPDATE models SET use_manual_features = false WHERE use_manual_features IS NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN models.features_path IS 'Path to the features JSON file in storage (for manual features models)';
COMMENT ON COLUMN models.use_manual_features IS 'Whether this model requires manual feature upload (true) or uses API features (false)';
COMMENT ON COLUMN models.activated_at IS 'Timestamp when the model was activated with NFT ID'; 