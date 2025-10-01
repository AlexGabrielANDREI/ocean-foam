-- Add eda_path column to models table for EDA report support
-- This migration adds the eda_path column to store the path to EDA report files

-- Add eda_path column (nullable TEXT)
ALTER TABLE models ADD COLUMN IF NOT EXISTS eda_path TEXT;

-- Create index for eda_path for better query performance
CREATE INDEX IF NOT EXISTS idx_models_eda_path ON models(eda_path);

-- Add comment to document the new column
COMMENT ON COLUMN models.eda_path IS 'Path to the EDA report PDF file in storage';
