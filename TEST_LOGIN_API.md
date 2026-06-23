# Test Login API Directly

To check if the backend is returning company data correctly, test it directly:

## Option 1: Using Browser Console

1. Open browser console (F12)
2. Paste this code (replace with your actual credentials):

```javascript
fetch('https://beautiful-gate-pos-api.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'army@gmail.com',
    password: 'YOUR_PASSWORD_HERE'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Full response:', data);
  console.log('Company data:', data.company);
  if (data.company) {
    console.log('✅ Company name:', data.company.name);
    console.log('✅ Company slug:', data.company.slug);
    console.log('✅ Primary color:', data.company.primary_color);
  } else {
    console.log('❌ No company data in response!');
  }
});
```

## Option 2: Using Render Logs

1. Go to https://dashboard.render.com
2. Click on your backend service (beautiful-gate-pos-api)
3. Click "Logs"
4. Login from your app
5. Look for the log line:
   ```
   🔍 Login - Company data being sent: {...}
   ```

This will show EXACTLY what the backend is sending.

## Option 3: Check Database Directly

Run this in Supabase SQL Editor:

```sql
-- Check if user has company_id
SELECT u.id, u.email, u.name, u.company_id,
       c.id as company_table_id, c.name as company_name, 
       c.slug, c.logo_url, c.primary_color
FROM users u
LEFT JOIN companies c ON u.company_id = c.id
WHERE u.email = 'army@gmail.com';
```

**Expected result:**
- `company_id` should be a UUID (not NULL)
- `company_name` should be your company name (not NULL)
- If `company_id` is NULL → user is not linked to any company
- If `company_name` is NULL but `company_id` is not → the company doesn't exist in database

## What to Look For

### If backend returns company data correctly:
```json
{
  "company": {
    "id": "some-uuid",
    "name": "Your Company Name",
    "slug": "your-slug",
    "logo_url": "...",
    "primary_color": "#ff0000"
  }
}
```
→ Problem is in the frontend (not storing/reading correctly)

### If backend returns null company:
```json
{
  "company": null
}
```
→ Problem is in the database (user.company_id is NULL or company doesn't exist)

### If backend returns 500 error:
→ Problem is in the backend code (SQL error or similar)
