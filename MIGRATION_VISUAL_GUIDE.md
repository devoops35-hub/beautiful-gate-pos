# Database Migration - Visual Guide

---

## 🎯 What's Happening

### Single-Tenant (Current)
```
Beautiful Gate POS
    ↓
┌─────────────────────────────────┐
│  Supabase Database              │
├─────────────────────────────────┤
│ users                           │
│ ├─ id                           │
│ ├─ email                        │
│ └─ password                     │
│                                 │
│ products                        │
│ ├─ id                           │
│ ├─ name                         │
│ └─ price                        │
│                                 │
│ sales                           │
│ ├─ id                           │
│ ├─ total                        │
│ └─ customer_email               │
└─────────────────────────────────┘
    ↓
All data for Beautiful Gate only
One company = One database
```

### Multi-Tenant (After Migration)
```
SaaS Platform (Beautiful Gate + Others)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Database (Shared Infrastructure)                  │
├─────────────────────────────────────────────────────────────┤
│ companies (NEW)                  ← Stores company info      │
│ ├─ id: 550e8400-...             ← Beautiful Gate            │
│ ├─ name: "Beautiful Gate"                                   │
│ ├─ slug: "beautiful-gate"                                   │
│ ├─ logo_url: "https://..."                                  │
│ └─ primary_color: "#0084FF"                                 │
│                                                              │
│ users                            ← Now linked to company    │
│ ├─ id                                                       │
│ ├─ email                                                    │
│ ├─ password                                                 │
│ └─ company_id: 550e8400-... ← LINKS TO COMPANY             │
│                                                              │
│ products                         ← Now linked to company    │
│ ├─ id                                                       │
│ ├─ name                                                     │
│ ├─ price                                                    │
│ └─ company_id: 550e8400-... ← LINKS TO COMPANY             │
│                                                              │
│ sales                            ← Now linked to company    │
│ ├─ id                                                       │
│ ├─ total                                                    │
│ ├─ customer_email                                           │
│ └─ company_id: 550e8400-... ← LINKS TO COMPANY             │
└─────────────────────────────────────────────────────────────┘
    ↓
All data organized by company
Multiple companies = One database
```

---

## 📊 Table Structure Changes

### BEFORE: users table
```
┌────┬──────────────┬──────────────┬────────┬───────┐
│ id │ email        │ password     │ name   │ role  │
├────┼──────────────┼──────────────┼────────┼───────┤
│ 1  │ john@bg.com  │ hash123      │ John   │ admin │
│ 2  │ jane@bg.com  │ hash456      │ Jane   │ user  │
│ 3  │ bob@bg.com   │ hash789      │ Bob    │ user  │
└────┴──────────────┴──────────────┴────────┴───────┘
```

### AFTER: users table
```
┌────┬──────────────┬──────────────┬────────┬───────┬──────────────────────────────────┐
│ id │ email        │ password     │ name   │ role  │ company_id (NEW)                 │
├────┼──────────────┼──────────────┼────────┼───────┼──────────────────────────────────┤
│ 1  │ john@bg.com  │ hash123      │ John   │ admin │ 550e8400-e29b-41d4-a716-... ↓  │
│ 2  │ jane@bg.com  │ hash456      │ Jane   │ user  │ 550e8400-e29b-41d4-a716-... ↓  │
│ 3  │ bob@bg.com   │ hash789      │ Bob    │ user  │ 550e8400-e29b-41d4-a716-... ↓  │
└────┴──────────────┴──────────────┴────────┴───────┴──────────────────────────────────┘
                                                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ companies table (NEW)                                                    │
├──────────────────────────────────┬──────────────────────────────────────┤
│ id: 550e8400-e29b-41d4-a716-... │ name: "Beautiful Gate"               │
│ slug: "beautiful-gate"           │ logo_url: "https://..."              │
│ primary_color: "#0084FF"         │ email: "info@bg.com"                 │
└──────────────────────────────────┴──────────────────────────────────────┘
```

---

## 🔗 Foreign Key Relationships

### Relationship Diagram
```
┌──────────────┐
│  companies   │  (1 company has many records)
├──────────────┤
│ id (PK)      │
│ name         │
│ slug         │
└──────────────┘
       ↑
       │ (company_id FK)
       │ ─────────────────────┬─────────────────────┬──────────────────
       │                      │                     │
       ↓                      ↓                     ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   users      │   │  products    │   │   sales      │
├──────────────┤   ├──────────────┤   ├──────────────┤
│ id           │   │ id           │   │ id           │
│ email        │   │ name         │   │ total        │
│ company_id ──┼───┼─ company_id ─┼───┼─ company_id ──┤
│ ...          │   │ ...          │   │ ...          │
└──────────────┘   └──────────────┘   └──────────────┘

Meaning:
- Each user belongs to ONE company
- Each product belongs to ONE company
- Each sale belongs to ONE company
- A company can have MANY users, products, sales
```

---

## 📝 Migration Steps Visualized

### Step 1-8: Create Tables & Add Columns
```
1. Create companies table ✅
   ├─ id (UUID, primary key)
   ├─ name
   ├─ slug (unique)
   ├─ logo_url
   ├─ primary_color
   └─ ... other fields

2. Add company_id to users ✅
3. Add company_id to products ✅
4. Add company_id to sales ✅
5. Add company_id to sale_products ✅
6. Add company_id to audit_logs ✅
7. Add company_id to refresh_tokens ✅

8. Create default company ✅
   └─ Beautiful Gate (slug: beautiful-gate)
```

### Step 9: Backfill Data
```
BEFORE:
┌────────────────────────────────┐
│ users                          │
├────┬──────────────┬────────────┤
│ id │ email        │ company_id │
├────┼──────────────┼────────────┤
│ 1  │ john@bg.com  │ NULL   ← Empty
│ 2  │ jane@bg.com  │ NULL   ← Empty
│ 3  │ bob@bg.com   │ NULL   ← Empty
└────┴──────────────┴────────────┘

AFTER:
┌────────────────────────────────┐
│ users                          │
├────┬──────────────┬────────────┤
│ id │ email        │ company_id │
├────┼──────────────┼────────────┤
│ 1  │ john@bg.com  │ 550e8400.. ← Filled
│ 2  │ jane@bg.com  │ 550e8400.. ← Filled
│ 3  │ bob@bg.com   │ 550e8400.. ← Filled
└────┴──────────────┴────────────┘
```

### Step 10: Make NOT NULL
```
Adds constraint: company_id CANNOT be NULL
   ↓
┌─────────────────────────────────┐
│ INSERT INTO users               │
│ (email, password)               │ ← MISSING company_id
│ VALUES ('new@user.com', 'hash') │
└─────────────────────────────────┘
         ↓
    ❌ ERROR!
    "NOT NULL constraint violated"
    Must provide company_id
```

---

## 🔐 Data Isolation Example

### After Migration - Users See Only Their Company's Data

```
USER: john@acme.com (company_id: ACME-UUID)
    ↓
Query: SELECT * FROM products
    ↓
Backend adds: WHERE company_id = 'ACME-UUID'
    ↓
Result: Only ACME's products shown
┌─────────────────────────────────────────┐
│ products (ACME filtered)                │
├────┬──────────┬───────┬──────────────────┤
│ id │ name     │ price │ company_id       │
├────┼──────────┼───────┼──────────────────┤
│ 1  │ Pen      │ 5.00  │ ACME-UUID ✅    │
│ 2  │ Notebook │ 10.00 │ ACME-UUID ✅    │
│ 3  │ Ink      │ 8.00  │ ACME-UUID ✅    │
└────┴──────────┴───────┴──────────────────┘

CANNOT see:
│ 4  │ Pizza    │ 25.00 │ PIZZA-CO-UUID   │ ❌ (Different company)
│ 5  │ Burger   │ 15.00 │ PIZZA-CO-UUID   │ ❌ (Different company)


USER: maria@pizza.com (company_id: PIZZA-CO-UUID)
    ↓
Query: SELECT * FROM products
    ↓
Backend adds: WHERE company_id = 'PIZZA-CO-UUID'
    ↓
Result: Only PIZZA-CO's products shown
┌─────────────────────────────────────────┐
│ products (PIZZA-CO filtered)            │
├────┬──────────┬───────┬──────────────────┤
│ id │ name     │ price │ company_id       │
├────┼──────────┼───────┼──────────────────┤
│ 4  │ Pizza    │ 25.00 │ PIZZA-CO-UUID ✅│
│ 5  │ Burger   │ 15.00 │ PIZZA-CO-UUID ✅│
└────┴──────────┴───────┴──────────────────┘

CANNOT see:
│ 1  │ Pen      │ 5.00  │ ACME-UUID       │ ❌ (Different company)
│ 2  │ Notebook │ 10.00 │ ACME-UUID       │ ❌ (Different company)
```

---

## 🎯 Query Changes After Migration

### Before Migration
```javascript
// All users
const users = await db.query('SELECT * FROM users');
// Returns: ALL 100 users

// All products
const products = await db.query('SELECT * FROM products');
// Returns: ALL 500 products
```

### After Migration
```javascript
// Company's users only
const users = await db.query(
  'SELECT * FROM users WHERE company_id = $1',
  [req.user.companyId]  // From JWT token
);
// Returns: Only 3 users in this company

// Company's products only
const products = await db.query(
  'SELECT * FROM products WHERE company_id = $1',
  [req.user.companyId]
);
// Returns: Only 12 products in this company
```

**Key Change**: Add `WHERE company_id = $1` to EVERY query

---

## 📈 Scaling Example

### Single Tenant (Current)
```
Beautiful Gate only:
- 3 users
- 12 products
- 45 sales
- 1 company

Database Size: ~50MB
Users: 3
Companies: 1 (hardcoded)
```

### Multi-Tenant (After Migration)
```
Beautiful Gate + Others:
- Company 1: 3 users, 12 products, 45 sales
- Company 2: 5 users, 8 products, 20 sales
- Company 3: 2 users, 15 products, 60 sales
- Company 4: 10 users, 30 products, 150 sales
- Company 5: 1 user, 5 products, 10 sales
- ... unlimited companies

Database Size: ~200MB (shared infrastructure)
Users: 21 (across all companies)
Companies: 5+ (unlimited scaling)
```

---

## ⏱️ Migration Timeline

```
14:00 - Start migration
  ↓
14:05 - Steps 1-8 complete (create tables, add columns)
  ↓
14:07 - Get company ID
  ↓
14:10 - Backfill data (Step 9)
  ↓
14:12 - Make NOT NULL (Step 10)
  ↓
14:15 - Verification queries
  ↓
14:20 - DONE! ✅
```

---

## ✅ Verification Checklist

After running migrations, run these checks:

```
□ companies table exists
  SELECT COUNT(*) FROM companies;
  Expected: 1 (Beautiful Gate)

□ company_id added to users
  SELECT company_id FROM users LIMIT 1;
  Expected: UUID (not NULL)

□ company_id added to products
  SELECT company_id FROM products LIMIT 1;
  Expected: UUID (not NULL)

□ company_id added to sales
  SELECT company_id FROM sales LIMIT 1;
  Expected: UUID (not NULL)

□ Indexes created
  SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'companies';
  Expected: 2+ indexes

□ Data isolated
  SELECT COUNT(*) FROM products WHERE company_id != '<company_id>';
  Expected: 0 (no cross-company data)
```

---

## 🚀 After Migration

### What You Can Do
✅ Create new companies  
✅ Each company has own workspace  
✅ Each company uploads logo  
✅ Data completely isolated  
✅ No cross-company data leakage  

### What's Next
1. Backend API endpoints (add company registration)
2. Frontend changes (add registration page)
3. Deploy to production
4. Invite companies to sign up

---

## 💡 Key Concept

**Before**: One database, one company  
**After**: One database, MANY companies, isolated data

**Security Principle**: Every query filters by `company_id`

This ensures data isolation and prevents cross-company access.

---

**You Ready?** Head to Supabase and run the migration! 🚀
