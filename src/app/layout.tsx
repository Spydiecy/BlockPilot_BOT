'use client';

import '@/app/globals.css';
import { AnimatedNavbar } from '@/components/navigation/AnimatedNavbar';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <main className="pb-20">
          {children}
          <AnimatedNavbar />
        </main>
      </body>
    </html>
  );
}