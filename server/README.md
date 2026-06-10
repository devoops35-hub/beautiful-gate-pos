# POS System Server

## Configuration

### Paystack Integration

To use Paystack for mobile money payments, you need to:

1. Sign up for a Paystack account at https://paystack.com
2. Get your API keys from the Paystack dashboard
3. Update the following environment variables in the `.env` file:

```
PAYSTACK_SECRET_KEY=your_actual_secret_key_here
PAYSTACK_PUBLIC_KEY=your_actual_public_key_here
```

### Environment Variables

Make sure to update all environment variables in the `.env` file:

```
MONGO_URI=your_mongodb_connection_string
PORT=3002
JWT_SECRET=your_jwt_secret
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```