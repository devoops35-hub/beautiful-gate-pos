const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY || 'your_paystack_secret_key');

// Check if the secret key is properly configured
if (!process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY === 'your_paystack_secret_key') {
  console.warn('Warning: Paystack secret key is not properly configured in environment variables');
}

module.exports = paystack;