# One Tap, No Gas, No Top-Up — Smart Wallet Checkout

A single-signature batched checkout application built on Base Sepolia using **Privy Smart Wallets** and Viem.

---

## Deliverable Configuration Details
- **Testnet:** Base Sepolia
- **Test Token:** USDC (or any standard ERC-20 test token deployed on Base Sepolia)
- **Account Implementation:** Privy Smart Wallets (embedded Ethereum wallets upgraded to Smart Accounts under the hood).
- **Sponsorship Configuration:** Gas sponsorship is handled automatically by configuring a Paymaster and Gas Policies in the Privy Dashboard (under Smart Wallets -> Sponsorship), which abstracts away all native token (ETH) requirements for the buyer.

---

## 1. Key Features & Architecture

- **Single User Approval / Batched Execution**: Combines ERC-20 `approve(CHECKOUT_CONTRACT, amount)` and `Checkout.pay(orderId, token, amount)` into a single `useSmartWallets().client.sendTransaction({ calls: [...] })` call.
- **Idempotency Guard**:
  - On-Chain: `paid[bytes32 orderId]` mapping in `Checkout.sol` prevents double-charging.
  - Client-Side: `localStorage`-keyed order guard (`order_paid_${orderId}`) disables checkout for completed orders.
- **Decimals-Aware**: Uses Viem `parseUnits(amount, tokenDecimals)` for exact token representation.
- **Gated Receipt Verification**: Verifies completion via `publicClient.waitForTransactionReceipt({ hash })` before displaying success UI.

---

## 2. Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set credentials:
   ```ini
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   NEXT_PUBLIC_CHECKOUT_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS=0x...
   ```
3. Run the dev server:
   ```bash
   pnpm dev
   ```
