// Paystack configuration for frontend
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_e5af73a9cfd63af75c2c0e4e92a56d0db1eb8ea0';

// Check if the public key is properly configured
if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
  console.warn('Warning: Paystack public key is not properly configured in environment variables');
}