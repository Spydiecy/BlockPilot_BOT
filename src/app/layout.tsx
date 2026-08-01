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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var key = 'auditfi-theme-mode';
                  var stored = localStorage.getItem(key);
                  var theme = stored === 'light' || stored === 'dark'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <WalletProvider>
            <HangingThemeToggle />
            <main className="pb-20">
              {children} 
              <AnimatedNavbar />
            </main>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
