# 🗄️ Create Database Tables in Supabase

Your backend is **working perfectly** but the database tables need to be created.

---

## ✅ Step 1: Go to Supabase Dashboard

1. Open: https://app.supabase.com
2. Select your project: `yxakmdoiivaiyjcdaxny`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

---

## ✅ Step 2: Copy & Paste the Schema

Open the file: `CREATE_TABLES.sql`

Copy ALL the SQL code and paste it into Supabase SQL Editor.

---

## ✅ Step 3: Run the Query

Click **Run** button (or Ctrl+Enter)

Wait for it to complete...

---

## ✅ Step 4: Verify Tables Created

In Supabase left sidebar:
- Click **Table Editor**
- You should see 7 tables:
  1. ✅ users
  2. ✅ products
  3. ✅ sales
  4. ✅ sale_products
  5. ✅ settings
  6. ✅ refresh_tokens
  7. ✅ audit_logs

---

## ✅ Step 5: Backend Will Work!

Once tables are created:
1. Your backend will automatically work
2. Frontend requests will succeed
3. You can start using the POS system

---

## 🎯 SQL File Contents

The `CREATE_TABLES.sql` file creates:
- ✅ All 7 required tables
- ✅ Proper relationships (foreign keys)
- ✅ Indexes for performance
- ✅ Default settings

---

## Quick Copy-Paste

Can't find the file? Here's the SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id BIGSERIAL PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sale_products table
CREATE TABLE IF NOT EXISTS public.sale_products (
  id BIGSERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON public.refresh_tokens(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('tax_rate', '0.075'),
  ('company_name', 'Beautiful Gate'),
  ('currency', 'NGN')
ON CONFLICT (key) DO NOTHING;
```

---

## ✅ After Tables Are Created

1. Backend will start working immediately
2. No restart needed
3. Frontend requests will succeed
4. You can register and login
5. You can add products
6. You can make sales

---

## 🚀 Then You're Done!

Your POS system will be fully operational!

Go to: http://localhost:5173 and start using it! 🎉
