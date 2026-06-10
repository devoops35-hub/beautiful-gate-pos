-- Fix Currency by deleting and re-inserting
-- If UPDATE doesn't work, this approach should work

-- 1. Check current value
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- 2. Delete the NGN record
DELETE FROM public.settings WHERE key = 'currency' AND value = 'NGN';

-- 3. Insert GHS record
INSERT INTO public.settings (key, value) 
VALUES ('currency', 'GHS')
ON CONFLICT (key) DO UPDATE SET value = 'GHS';

-- 4. Verify
SELECT id, key, value FROM public.settings WHERE key = 'currency';

-- 5. Check all settings
SELECT * FROM public.settings;
