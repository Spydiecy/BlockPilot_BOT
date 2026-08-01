'use client';


import { AnimatedNavbar } from '@/components/navigation/AnimatedNavbar';
import { HangingThemeToggle } from '@/components/theme/HangingThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WalletProvider } from '@/contexts/WalletContext';

import '@/app/globals.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <WalletProvider>
            <HangingThemeToggle />
            <main className="pb-20 pt-6">
              {children} 
              <AnimatedNavbar />
            </main>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
