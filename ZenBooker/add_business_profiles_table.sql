-- Add business profiles table
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

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id); 