-- Fix RLS Permissions for Companies Table
-- Run this in Supabase SQL Editor
-- This fixes the permission denied error for company registration

-- ============================================================================
-- OPTION 1: Disable RLS entirely (simplest, less secure)
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: Grant permissions with RLS enabled (more secure)
-- Uncomment the following if you prefer to keep RLS enabled
-- ============================================================================

-- -- Enable RLS on all tables
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sale_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -- Create policy to allow anon role to access companies table (for registration)
-- CREATE POLICY "Allow anon access to companies" ON public.companies
--   FOR ALL USING (true) WITH CHECK (true);

-- -- Create policy to allow anon role to access users table (for registration/login)
-- CREATE POLICY "Allow anon access to users" ON public.users
--   FOR ALL USING (true) WITH CHECK (true);

-- -- Create policies for other tables
-- CREATE POLICY "Allow anon access to products" ON public.products
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow anon access to sales" ON public.sales
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow anon access to sale_products" ON public.sale_products
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow anon access to settings" ON public.settings
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow anon access to refresh_tokens" ON public.refresh_tokens
--   FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow anon access to audit_logs" ON public.audit_logs
--   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Grant permissions to anon role (required regardless of RLS setting)
-- ============================================================================

-- Grant permissions on companies table (MISSING - this is the fix!)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions on all other tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon;

-- ============================================================================
-- Verification
-- ============================================================================

-- Check if permissions are granted
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
