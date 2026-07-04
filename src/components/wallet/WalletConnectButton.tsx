'use client';

import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/config/wallet';
import { useState, useCallback, useEffect } from 'react';

interface WalletConnectButtonProps {
  className?: string;
}

export function WalletConnectButton({ className = '' }: WalletConnectButtonProps) {
  const { 
    isConnected, 
    isConnecting, 
    address, 
    currentChain,
    balance,
    connect, 
    disconnect 
  } = useWallet();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle connect button click
  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [connect]);

  // Handle disconnect button click
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [disconnect]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <button className="px-4 py-2 bg-gray-800 text-white rounded-lg opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`${className} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 flex items-center space-x-2`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative wallet-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="font-medium">
          {address ? formatAddress(address) : 'Connected'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isDropdownOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Connected with</span>
              <span className="text-sm font-medium text-white">
                {address ? formatAddress(address) : 'Wallet'}
              </span>
            </div>
            {balance !== undefined && (
              <div className="mt-2">
                <div className="text-2xl font-bold text-white">
                  {balance} {currentChain?.currency || 'ETH'}
                </div>
                <div className="text-xs text-gray-400">
                  {currentChain?.name || 'Network'}
                </div>
              </div>
            )}
          </div>
          <div className="p-2">
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
