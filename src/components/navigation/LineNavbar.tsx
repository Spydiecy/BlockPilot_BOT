'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  House, 
  MagnifyingGlass, 
  Wallet, 
  User, 
  TestTube, 
  BookOpen, 
  IconProps 
} from 'phosphor-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<IconProps>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: House },
  { path: '/audit', label: 'Audit', icon: MagnifyingGlass },
  { path: '/testcase-generator', label: 'Test Cases', icon: TestTube },
  { path: '/documentor', label: 'Documentation', icon: BookOpen },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/profile', label: 'Profile', icon: User },
];

export function LineNavbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed bottom-8 left-1/2 z-50"
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      initial={{ y: 100, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
    >
      <div className="relative flex items-center justify-center">
        {/* Background and Border */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-lg border border-gray-800"
          initial={{ height: '5px', width: '200px' }}
          animate={{ 
            height: isExpanded ? '64px' : '5px', 
            width: isExpanded ? '320px' : '200px'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ borderRadius: isExpanded ? '16px' : '4px' }}
        />
        
        {/* Animated Gradient Line */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: isExpanded ? 0 : 1 }}
          transition={{ duration: 0.2, delay: isExpanded ? 0 : 0.1 }}
          style={{
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0), #4a4a4a, #8a8a8a, #c5c5c5, #8a8a8a, #4a4a4a, rgba(0,0,0,0))',
            backgroundSize: '300% 100%',
            animation: 'flow 8s ease-in-out infinite',
          }}
        />

        {/* Icons and Labels */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="flex items-center justify-around w-full h-full px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              {navItems.map((item) => (
                <Link href={item.path} key={item.path} passHref>
                  <motion.div className="relative flex flex-col items-center justify-center group">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <item.icon 
                        size={28} 
                        className={`transition-colors duration-300 ${pathname === item.path ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}`}
                        weight={pathname === item.path ? 'fill' : 'regular'}
                      />
                    </motion.div>
                    <motion.div 
                      className="absolute -top-7 text-xs bg-gray-900 text-white px-2 py-1 rounded-md whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ y: 5 }}
                      animate={{ y: 0 }}
                      style={{ pointerEvents: 'none' }}
                    >
                      {item.label}
                    </motion.div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
       <style jsx global>{`
        @keyframes flow {
          0% { background-position: 200% 50%; }
          50% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </motion.nav>
  );
}

