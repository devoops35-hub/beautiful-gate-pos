# Quick Fix: Currency NGN → GHS

⏱️ **Time**: 2 minutes

---

## What To Do

### 1. Open Supabase
https://app.supabase.com → Select Project → SQL Editor

### 2. Copy-Paste This SQL

```sql
UPDATE public.settings SET value = 'GHS' WHERE key = 'currency';
SELECT * FROM public.settings WHERE key = 'currency';
```

### 3. Click "Run" ▶️

### 4. Verify Result

Should show:
```
currency | GHS ✅
```

### 5. Restart Server

```bash
npm start
```

### 6. Refresh Browser

`Ctrl+Shift+R`

---

## Done! ✅

Currency is now GHS (Ghana Cedi) in database.
