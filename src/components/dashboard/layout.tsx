'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  IconRobot,
  IconShieldLock,
  IconFileText,
  IconTestPipe,
  IconReportAnalytics,
  IconUser,
  IconHome,
  IconMenu2,
  IconX,
  IconArrowLeft
} from '@tabler/icons-react';
import { Lightning } from 'phosphor-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

const mainNavItems: NavItem[] = [
  {
    label: 'AI Agent',
    href: '/dashboard/ai-agent',
    icon: <IconRobot className="w-5 h-5" />,
    description: 'Chat with our AI to analyze contracts'
  },
  {
    label: 'Smart Contract Audit',
    href: '/dashboard/audit',
    icon: <IconShieldLock className="w-5 h-5" />,
    description: 'Automated security analysis'
  },
  {
    label: 'Documentation',
    href: '/dashboard/documents',
    icon: <IconFileText className="w-5 h-5" />,
    description: 'Auto-generated smart contract docs'
  },
  {
    label: 'Test Cases',
    href: '/dashboard/test-cases',
    icon: <IconTestPipe className="w-5 h-5" />,
    description: 'Generated test suites'
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: <IconReportAnalytics className="w-5 h-5" />,
    description: 'View security reports'
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: <IconUser className="w-5 h-5" />,
    description: 'Manage your account'
  }
];

const secondaryNavItems: NavItem[] = [
  {
    label: 'Back to Home',
    href: '/',
    icon: <IconArrowLeft className="w-5 h-5" />,
    description: 'Return to landing page'
  }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-neutral-900 rounded-lg md:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <IconX className="w-6 h-6" />
        ) : (
          <IconMenu2 className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-72 h-screen transition-transform bg-neutral-900/50 backdrop-blur-xl border-r border-neutral-800",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300" />
              
              {/* Logo Container */}
              <div className="relative flex items-center bg-black border border-neutral-800 group-hover:border-blue-500/50 px-4 py-2 rounded-lg transition duration-300">
                {/* Lightning Bolt */}
                <div className="mr-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                  <Lightning className="w-6 h-6" weight="bold" />
                </div>
                
                {/* Text */}
                <span className="text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300 group-hover:from-blue-400 group-hover:to-white transition duration-300">
                  BlockPilot
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-4 py-2">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Main</h2>
            </div>
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                  "hover:bg-blue-500/10",
                  pathname === item.href
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-neutral-400 hover:text-blue-400"
                )}
              >
                {item.icon}
                <div>
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      {item.description}
                    </p>
                  )}
                </div>
                {pathname === item.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-6 space-y-1">
            <div className="px-4 py-2">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Tools</h2>
            </div>
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                  "hover:bg-blue-500/10",
                  pathname === item.href
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-neutral-400 hover:text-blue-400"
                )}
              >
                {item.icon}
                <div>
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      {item.description}
                    </p>
                  )}
                </div>
                {pathname === item.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Back to Home - Bottom */}
          <div className="mt-auto pt-4 border-t border-neutral-800">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 group"
            >
              <IconHome className="w-5 h-5" />
              <div>
                <span className="font-medium">Back to Home</span>
                <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
                  Return to landing page
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        isSidebarOpen ? "md:ml-72" : "md:ml-0",
        "p-8"
      )}>
        {children}
      </main>
    </div>
  );
} 