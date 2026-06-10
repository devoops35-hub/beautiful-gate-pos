# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Paystack Configuration

To use Paystack for mobile money payments, you need to:

1. Sign up for a Paystack account at https://paystack.com
2. Get your API keys from the Paystack dashboard
3. Update the following environment variable in the `.env` file:

```
VITE_PAYSTACK_PUBLIC_KEY=your_actual_public_key_here
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
