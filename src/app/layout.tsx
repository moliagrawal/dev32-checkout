import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'One Tap Checkout — Privy Smart Wallets',
  description: 'Single-signature batched ERC-20 approve and payment execution using Privy Smart Accounts on Base Sepolia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
