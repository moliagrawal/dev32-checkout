'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { createPublicClient, http, encodeFunctionData, parseUnits, stringToHex, pad } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CHECKOUT_CONTRACT_ADDRESS, PAYMENT_TOKEN_ADDRESS, erc20Abi, checkoutAbi } from '@/lib/contracts';

interface CheckoutCardProps {
  orderId?: string;
  amountStr?: string;
  tokenDecimals?: number;
}

export function CheckoutCard({
  orderId = 'ORD-2026-9021',
  amountStr = '15.00',
  tokenDecimals = 6,
}: CheckoutCardProps) {
  const { login, authenticated, user } = usePrivy();
  const { client } = useSmartWallets();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'submitting' | 'waiting' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  // Convert orderId string to bytes32 format
  const bytes32OrderId = pad(stringToHex(orderId), { size: 32 });

  useEffect(() => {
    // Check localStorage order guard
    const storedHash = localStorage.getItem(`order_paid_${orderId}`);
    if (storedHash) {
      setAlreadyPaid(true);
      setTxHash(storedHash);
      setStatus('success');
    }
  }, [orderId]);

  async function handleCheckout() {
    setLoading(true);
    setErrorMessage(null);
    setStatus('preparing');

    try {
      if (!client) {
        throw new Error('Smart wallet client not initialized. Please connect your account.');
      }

      // Check order guard again before proceeding
      if (localStorage.getItem(`order_paid_${orderId}`)) {
        setAlreadyPaid(true);
        setStatus('success');
        throw new Error(`Order ${orderId} has already been paid.`);
      }

      // Decimals-aware amount conversion
      const parsedAmount = parseUnits(amountStr, tokenDecimals);

      // Call 1: ERC-20 approve
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [CHECKOUT_CONTRACT_ADDRESS, parsedAmount],
      });

      // Call 2: Checkout contract pay
      const payData = encodeFunctionData({
        abi: checkoutAbi,
        functionName: 'pay',
        args: [bytes32OrderId, PAYMENT_TOKEN_ADDRESS, parsedAmount],
      });

      setStatus('submitting');

      // Batched execution via Smart Wallet sendTransaction (One Tap, single signature)
      const hash = await client.sendTransaction({
        calls: [
          {
            to: PAYMENT_TOKEN_ADDRESS,
            data: approveData,
            value: BigInt(0),
          },
          {
            to: CHECKOUT_CONTRACT_ADDRESS,
            data: payData,
            value: BigInt(0),
          },
        ],
      });

      setStatus('waiting');

      // Gated receipt verification
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });

      if (receipt.status !== 'success') {
        throw new Error('Transaction execution reverted on-chain.');
      }

      // Record in order guard
      localStorage.setItem(`order_paid_${orderId}`, hash);
      setTxHash(hash);
      setAlreadyPaid(true);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Smart wallet checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-md w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80">
            One-Tap Smart Checkout
          </span>
          <h2 className="text-xl font-extrabold text-slate-100 mt-2">Bakery Order #{orderId}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-400">${amountStr}</div>
          <div className="text-xs text-slate-400">USDC (Base Sepolia)</div>
        </div>
      </div>

      {/* Item summary */}
      <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>Sourdough Loaf (x2)</span>
          <span className="font-semibold text-slate-200">$10.00</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Almond Croissant (x2)</span>
          <span className="font-semibold text-slate-200">$5.00</span>
        </div>
        <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-slate-100">
          <span>Total (No Gas Fees)</span>
          <span className="text-emerald-400">${amountStr} USDC</span>
        </div>
      </div>

      {/* Status & Error handling */}
      {status === 'error' && errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-start space-x-2">
          <span className="font-bold text-rose-400">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-5 p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-emerald-400 text-sm flex items-center space-x-1.5">
            <span>✓</span>
            <span>Payment Complete!</span>
          </div>
          <p className="text-emerald-200/80">Order {orderId} has been successfully settled via Smart Account batch call.</p>
          {txHash && (
            <div className="font-mono text-[11px] truncate text-indigo-300 pt-1">
              Tx: {txHash}
            </div>
          )}
        </div>
      )}

      {/* Checkout Action Button */}
      {!authenticated ? (
        <button
          onClick={login}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
        >
          Connect Account to Pay
        </button>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading || alreadyPaid}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg ${
            alreadyPaid
              ? 'bg-slate-800 border border-slate-700 text-slate-400 cursor-default'
              : loading
              ? 'bg-indigo-700 text-indigo-200 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>
                {status === 'preparing' && 'Preparing Batched Calls...'}
                {status === 'submitting' && 'Signing Single-Tap Batch...'}
                {status === 'waiting' && 'Verifying On-Chain Receipt...'}
              </span>
            </span>
          ) : alreadyPaid ? (
            '✓ Order Already Settled'
          ) : (
            'One-Tap Pay with Smart Wallet'
          )}
        </button>
      )}
    </div>
  );
}
