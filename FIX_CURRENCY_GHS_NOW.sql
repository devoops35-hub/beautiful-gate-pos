-- Fix Currency Setting from NGN (Naira) to GHS (Ghana Cedi)
-- Run this in Supabase SQL Editor NOW

-- 1. Check current value
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- 2. Update currency to GHS
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';

-- 3. Verify the update
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- 4. You should see:
-- | id | key      | value |
-- |----|----------|-------|
-- | 3  | currency | GHS   |
