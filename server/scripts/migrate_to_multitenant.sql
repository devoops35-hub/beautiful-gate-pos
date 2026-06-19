-- Multi-Tenant Database Migration Script
-- Run this in Supabase SQL Editor
-- Date: June 10, 2026

-- ============================================================================
-- STEP 1: Create Companies Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0084FF',
  secondary_color VARCHAR(7) DEFAULT '#4CAF50',
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  industry VARCHAR(100),
  subscription_tier VARCHAR(50) DEFAULT 'FREE',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- ============================================================================
-- STEP 2: Add company_id to Users Table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- ============================================================================
-- STEP 3: Add company_id to Products Table
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_name ON products(company_id, name);

-- ============================================================================
-- STEP 4: Add company_id to Sales Table
-- ============================================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, created_at);

-- ============================================================================
-- STEP 5: Add company_id to Sales Items Table (if exists)
-- ============================================================================

ALTER TABLE sale_products ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE sale_products 
ADD CONSTRAINT fk_sale_products_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_sale_products_company_id ON sale_products(company_id);

-- ============================================================================
-- STEP 6: Add company_id to Audit Logs Table (if exists)
-- ============================================================================

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);

-- ============================================================================
-- STEP 7: Add company_id to Refresh Tokens Table (if exists)
-- ============================================================================

ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS company_id UUID;

-- Create foreign key constraint
ALTER TABLE refresh_tokens 
ADD CONSTRAINT fk_refresh_tokens_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_company_id ON refresh_tokens(company_id);

-- ============================================================================
-- STEP 8: Create Default Company for Existing Data
-- ============================================================================

-- This will only insert if a company with this slug doesn't exist
INSERT INTO companies (name, slug, email, phone, address, industry, subscription_tier)
VALUES (
  'Beautiful Gate',
  'beautiful-gate',
  'info@beautifulgate.com',
  '+233501234567',
  'Accra, Ghana',
  'Stationery & Printing',
  'FREE'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- STEP 9: Backfill Existing Data with Default Company
-- ============================================================================

-- Get the default company ID
-- NOTE: After running this query, you'll get the company_id. Replace 'COMPANY_ID_HERE' below with the actual ID

-- First, let's get the company ID and store it
-- Run this separately to get the ID:
-- SELECT id FROM companies WHERE slug = 'beautiful-gate';

-- Then backfill using the ID you get:
-- UPDATE users SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
-- UPDATE products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
-- UPDATE sales SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
-- UPDATE sale_products SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
-- UPDATE audit_logs SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;
-- UPDATE refresh_tokens SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;

-- ============================================================================
-- STEP 10: Make company_id NOT NULL (after backfilling)
-- ============================================================================

-- IMPORTANT: Only run these after backfilling in STEP 9
-- ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE sales ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE sale_products ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE audit_logs ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE refresh_tokens ALTER COLUMN company_id SET NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the migration worked:

-- Check companies table
SELECT COUNT(*) as company_count FROM companies;

-- Check if company_id columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'company_id';

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'companies' OR tablename = 'users' OR tablename = 'products';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
