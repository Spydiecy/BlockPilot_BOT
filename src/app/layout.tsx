'use client';


import { AnimatedNavbar } from '@/components/navigation/AnimatedNavbar';
import { WalletProvider } from '@/contexts/WalletContext';

import '@/app/globals.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black text-white min-h-screen">
        <WalletProvider>
          <main className="pb-20">
            {children} 
            <AnimatedNavbar />
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}