-- Disable RLS on settings table and fix currency
-- Run these commands one by one in Supabase SQL Editor

-- 1. First, check if RLS is enabled
SELECT * FROM pg_tables WHERE tablename = 'settings';

-- 2. Disable RLS on settings table (if enabled)
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 3. Now update the currency
UPDATE public.settings 
SET value = 'GHS' 
WHERE key = 'currency';

-- 4. Verify the update
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- 5. Check all settings
SELECT * FROM public.settings;
