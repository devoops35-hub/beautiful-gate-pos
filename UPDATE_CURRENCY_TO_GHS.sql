-- Update Currency from NGN to GHS in Supabase
-- Run this in Supabase SQL Editor immediately

-- First, let's see what's currently there
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- Update currency setting from NGN to GHS
UPDATE public.settings 
SET value = 'GHS'
WHERE key = 'currency';

-- Verify the update was successful
SELECT id, key, value FROM public.settings WHERE key = 'currency';
