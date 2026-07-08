'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiFileText, FiShield, FiUser, FiZap, FiCreditCard, FiBookOpen } from 'react-icons/fi';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export function AnimatedNavbar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <FiHome /> },
    { name: 'Audit', path: '/audit', icon: <FiShield /> },
    { name: 'Test Cases', path: '/testcase-generator', icon: <FiZap /> },
    { name: 'Documentator', path: '/documentor', icon: <FiBookOpen /> },
    { name: 'Reports', path: '/reports', icon: <FiFileText /> },
    { name: 'Profile', path: '/profile', icon: <FiUser /> },
    { name: 'Wallet', path: '/wallet', icon: <FiCreditCard /> },
  ];

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNav = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      ref={navRef}
      className="fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out"
      style={{
        bottom: '40px',
        width: '65%',
        maxWidth: '650px',
        transform: `translate(-50%, ${isVisible ? '0' : '100%'})`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* The line that transforms into the navbar */}
        <div 
          className={`w-full mx-auto transition-all duration-300 ${
            isHovered ? 'h-0 opacity-0' : 'h-1.5 opacity-100'
          }`}
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0), #4a4a4a, #6b6b6b, #8a8a8a, #a8a8a8, #c5c5c5, #a8a8a8, #8a8a8a, #6b6b6b, #4a4a4a, rgba(0,0,0,0))',
            backgroundSize: '300% 100%',
            animation: isHovered ? 'none' : 'flow 8s ease-in-out infinite',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
          }}
        />

        {/* Navbar that appears from the line */}
        <div 
          className={`bg-black/90 backdrop-blur-lg rounded-t-2xl border border-gray-700 shadow-2xl transition-all duration-300 absolute bottom-0 left-0 w-full ${
            isHovered ? 'opacity-100 h-16 -translate-y-0' : 'opacity-0 h-0 -translate-y-2 overflow-hidden border-t-0 border-l-0 border-r-0'
          }`}
        >
          <div className="flex items-center justify-center h-full px-4 pb-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center px-4 py-3 transition-all duration-300 ${
                  pathname === item.path 
                    ? 'text-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="text-xl transition-transform duration-300 hover:scale-125">
                  {item.icon}
                </div>
                <span 
                  className={`text-xs mt-1 transition-all duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0 h-0 mt-0'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes flow {
          0% { background-position: 100% 50%; }
          50% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
