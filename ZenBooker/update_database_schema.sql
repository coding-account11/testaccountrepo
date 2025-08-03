-- Add missing columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS auto_category TEXT;

-- Add missing columns to integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP;

-- Create business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  business_name TEXT,
  business_category TEXT,
  location TEXT,
  business_email TEXT,
  brand_voice TEXT,
  short_business_bio TEXT,
  products_services TEXT,
  business_materials TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for business profiles
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id); 