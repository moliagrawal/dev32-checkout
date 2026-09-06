'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { baseSepolia } from 'viem/chains';

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = (process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.NEXT_PUBLIC_PRIVY_APP_ID.length === 25)
    ? process.env.NEXT_PUBLIC_PRIVY_APP_ID
    : 'cl12345678901234567890123';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#10b981',
        },
      }}
    >
      <SmartWalletsProvider>
        {children}
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
