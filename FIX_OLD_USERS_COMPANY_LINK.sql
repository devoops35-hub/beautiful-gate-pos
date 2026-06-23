-- Fix Old Users Without Company Links
-- This script links existing users to a company

-- STEP 1: Check which users don't have a company_id
SELECT id, email, name, role, company_id 
FROM users 
WHERE company_id IS NULL;

-- STEP 2: Get the company ID you want to link them to
-- (Replace 'beautiful-gate' with your actual company slug)
SELECT id, name, slug 
FROM companies 
WHERE slug = 'beautiful-gate' OR name = 'Beautiful Gate';

-- STEP 3: Update users to link them to a company
-- Replace 'YOUR_COMPANY_ID_HERE' with the actual UUID from step 2
-- Replace 'army@gmail.com' with the actual email
UPDATE users 
SET company_id = 'YOUR_COMPANY_ID_HERE'
WHERE email = 'army@gmail.com' AND company_id IS NULL;

-- STEP 4: Verify the update
SELECT u.id, u.email, u.name, u.role, u.company_id, c.name as company_name, c.slug
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'army@gmail.com';

-- ALTERNATIVE: If you want to link ALL users without company to the default company:
-- UPDATE users 
-- SET company_id = (SELECT id FROM companies WHERE slug = 'beautiful-gate' LIMIT 1)
-- WHERE company_id IS NULL;
