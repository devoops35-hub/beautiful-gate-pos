# Quick Test Guide - Payment Flow & Fixes

## Fixes Applied
1. ✅ Register endpoint - Fixed `result.rows[0].id` → `result.lastID`
2. ✅ Verify endpoint - Simplified response to fix 500 errors
3. ✅ CreateSale endpoint - Simplified response structure
4. ✅ Response serialization - Now returns clean, JSON-safe objects

---

## How to Test

### Step 1: Start Backend Server
```bash
cd "c:\Users\XKUISIT\Downloads\Porject I\server"
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║  🚀 POS Server running on port 3003    ║
║  Environment: DEVELOPMENT              ║
╚════════════════════════════════════════╝
```

### Step 2: Start Frontend (in NEW terminal)
```bash
cd "c:\Users\XKUISIT\Downloads\Porject I\client"
npm run dev
```

Expected: Frontend starts on `http://localhost:5173`

### Step 3: Test Payment Flow

#### Option A: Using Existing Account
1. Open browser to `http://localhost:5173`
2. Login with credentials you have
3. Go to Sales/Dashboard tab
4. Add products to cart
5. Click "Pay" button
6. Select payment method: **Mobile Money**
7. Click "Confirm Sale"

**Expected Results**:
- ✅ Cart clears after payment
- ✅ Success toast notification appears
- ✅ Payment saved to database
- ✅ No 500 error on verify endpoint
- ✅ Server logs show "Sale saved successfully with ID: [number]"

#### Option B: Register New Account First
1. Click "Register" link
2. Fill in details (email, name, password)
3. Click "Register"
4. You should be logged in automatically
5. Follow steps 3-7 above

**Expected for Register**:
- ✅ No 500 error during registration
- ✅ Account created successfully
- ✅ Automatic login after registration
- ✅ Redirect to dashboard/inventory

---

## Monitor Server Logs

While testing, watch the server terminal for these key logs:

### Successful Payment Flow
```
Sale data being sent: Object
Verify data being sent: Object
Processing Mobile Money/Cash payment - saving directly
Sale saved successfully with ID: [number]
```

### If You See Errors
```
Error saving sale to database: [error message]
verifyTransaction error: [error message]
Server error: An internal server error occurred
```

---

## Expected Response Format

### Successful Verify Response (200 OK)
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "id": 1,
    "total": 110,
    "payment_method": "Mobile Money"
  }
}
```

### Failed Verify Response (400/500)
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

## Database Verification

To verify payments were saved:

### Option 1: Supabase Dashboard
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to "sales" table
3. Should see new rows with your payments

### Option 2: Direct Query
In Supabase SQL editor:
```sql
SELECT * FROM sales ORDER BY created_at DESC LIMIT 5;
```

---

## Browser DevTools Checks

### Console Tab
- Should NOT see React key warnings for ProductList/Cart
- Should see "Token added to request: eyJhbGciOiJI..." messages
- Should see payment logs

### Network Tab
1. Filter by "verify"
2. Click "Pay" and "Confirm Sale"
3. Look for request to: `POST /api/sales/verify/[reference]`
4. Should see 200 status (not 500)
5. Response should have `"success": true`

---

## Troubleshooting

### Issue: Still Getting 500 on /verify
1. Check server console for exact error
2. Verify Supabase connection is active
3. Check if sales_products table exists
4. Try clearing browser cache: Ctrl+Shift+Delete

### Issue: Registration Still Failing
1. Check .env file has JWT_SECRET set
2. Look at server logs for database error
3. Verify users table exists in Supabase
4. Try with different email address

### Issue: Cart Not Clearing After Payment
1. Check browser console for errors
2. Verify success response was received (status 200)
3. Check PaymentDetails.jsx console.log output
4. Refresh page to see updated cart

### Issue: React Key Warnings Still Showing
1. Hard refresh page: Ctrl+Shift+R
2. Close and reopen DevTools
3. Open React DevTools extension
4. Check element hierarchy to find source

---

## Quick Database Setup (If Needed)

If tables don't exist, run migration:

```bash
cd server
node scripts/migrate.js
```

Or manually create tables in Supabase SQL:

```sql
-- Create sales table if missing
CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_products table if missing
CREATE TABLE IF NOT EXISTS sales_products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sale_id BIGINT NOT NULL REFERENCES sales(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);
```

---

## Success Criteria

✅ All of these should pass:

- [ ] Login works without 401 errors
- [ ] Can add products to cart
- [ ] Verify endpoint returns 200 (not 500)
- [ ] Sale data is saved to database
- [ ] Cart clears after successful payment
- [ ] Success toast appears
- [ ] No React key warnings in console
- [ ] Token refresh works (wait 15+ min between requests)
- [ ] Can register new account
- [ ] New account can login and make purchases

---

## Next Steps After Successful Testing

1. **Document any remaining issues** - Create new issue file
2. **Fix React warnings** if still present - Use React DevTools to identify source
3. **Test token refresh** - Make request after 15+ minutes
4. **Test all payment methods** - Cash, Mobile Money, Paystack card
5. **Load test** - Multiple products, multiple customers
6. **Deploy to staging** - Use Docker Compose

---

## Support

If you encounter issues not listed above:
1. Check the FIXES_APPLIED.md for details
2. Review server logs for specific errors
3. Check Supabase connection status
4. Verify all environment variables are set
5. Check database tables exist and have data

Good luck! 🚀
