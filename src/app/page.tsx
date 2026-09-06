'use client';

export const dynamic = 'force-dynamic';

import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { CheckoutCard } from '@/components/CheckoutCard';

export default function Home() {
  const { login, logout, authenticated } = usePrivy();
  const { client: smartWallet } = useSmartWallets();

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              Smart Wallet Batched Calls
            </span>
            <span className="text-xs text-slate-400">Base Sepolia</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 mt-2 tracking-tight">
            One-Tap Smart Checkout
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Batch ERC-20 token approval and merchant payment into a single signature.
          </p>
        </div>

        <div>
          {authenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
                {smartWallet?.account?.address ? `${smartWallet.account.address.slice(0, 6)}...${smartWallet.account.address.slice(-4)}` : 'Loading...'}
              </span>
              <button
                onClick={logout}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-emerald-600/25 transition-all"
            >
              Connect Account
            </button>
          )}
        </div>
      </header>

      {/* Main Checkout View */}
      <div className="flex flex-col items-center justify-center">
        <CheckoutCard />
      </div>
    </main>
  );
}
