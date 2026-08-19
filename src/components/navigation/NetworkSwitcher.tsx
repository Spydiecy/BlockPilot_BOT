'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiChevronUp, FiCheck, FiLoader, FiWifi } from 'react-icons/fi';
import { useWallet } from '@/contexts/WalletContext';
import { getSupportedChains, PREFERRED_CHAIN_STORAGE_KEY, type SupportedChain } from '@/config/wallet';

interface NetworkSwitcherProps {
  isLightTheme: boolean;
  /** Whether the parent navbar is currently expanded/hovered — controls label visibility */
  showLabel: boolean;
}

export function NetworkSwitcher({ isLightTheme, showLabel }: NetworkSwitcherProps) {
  const { currentChain, chainId, isConnected, switchChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chains = getSupportedChains();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear any stale error once the dropdown closes
  useEffect(() => {
    if (!isOpen) setSwitchError(null);
  }, [isOpen]);

  const handleSelectChain = useCallback(async (chain: SupportedChain) => {
    setSwitchError(null);

    if (!isConnected) {
      // No wallet connected yet — just remember the preference for next connect.
      try {
        window.localStorage.setItem(PREFERRED_CHAIN_STORAGE_KEY, String(chain.id));
      } catch {
        // no-op — localStorage unavailable
      }
      setIsOpen(false);
      return;
    }

    if (chainId === chain.id) {
      setIsOpen(false);
      return;
    }

    setSwitchingId(chain.id);
    try {
      await switchChain(chain.id);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setSwitchError(err?.message?.includes('rejected') ? 'Switch cancelled' : 'Failed to switch network');
    } finally {
      setSwitchingId(null);
    }
  }, [isConnected, chainId, switchChain]);

  // Determine what to show as the "active" chain — the connected chain if valid,
  // otherwise the user's saved preference, otherwise just a generic placeholder.
  const activeChain: SupportedChain | undefined = isConnected ? currentChain : undefined;
  const displayChain = activeChain ?? chains.find((c) => c.testnet) ?? chains[0];
  const isUnrecognized = isConnected && !currentChain;

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center">
      {/* Dropdown — opens upward since navbar is bottom-docked */}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-3 w-56 rounded-2xl border backdrop-blur-lg shadow-2xl overflow-hidden ${
            isLightTheme
              ? 'bg-white/95 border-blue-200/80 shadow-blue-500/10'
              : 'bg-black/95 border-gray-700 shadow-black/40'
          }`}
        >
          <div
            className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${
              isLightTheme ? 'text-slate-400 border-b border-blue-100' : 'text-gray-500 border-b border-gray-800'
            }`}
          >
            Select Network
          </div>
          <div className="py-1.5">
            {chains.map((chain) => {
              const isActive = isConnected ? chainId === chain.id : displayChain.id === chain.id;
              const isSwitching = switchingId === chain.id;

              return (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => handleSelectChain(chain)}
                  disabled={switchingId !== null}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 text-left disabled:cursor-not-allowed ${
                    isLightTheme
                      ? 'hover:bg-blue-50 text-slate-700'
                      : 'hover:bg-white/5 text-gray-200'
                  }`}
                >
                  <div className="relative w-6 h-6 flex-shrink-0 rounded-full overflow-hidden bg-neutral-800">
                    <Image src={chain.iconPath} alt={chain.name} width={24} height={24} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{chain.name}</span>
                      {chain.testnet && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isLightTheme ? 'bg-amber-100 text-amber-600' : 'bg-yellow-500/15 text-yellow-400'
                          }`}
                        >
                          TEST
                        </span>
                      )}
                      {!chain.testnet && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isLightTheme ? 'bg-green-100 text-green-600' : 'bg-green-500/15 text-green-400'
                          }`}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isLightTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                      {chain.currency}
                    </span>
                  </div>
                  {isSwitching ? (
                    <FiLoader className="animate-spin flex-shrink-0" size={14} />
                  ) : isActive ? (
                    <FiCheck className="text-blue-400 flex-shrink-0" size={16} />
                  ) : null}
                </button>
              );
            })}
          </div>
          {switchError && (
            <div
              className={`px-4 py-2 text-xs border-t ${
                isLightTheme ? 'border-blue-100 text-red-500' : 'border-gray-800 text-red-400'
              }`}
            >
              {switchError}
            </div>
          )}
          {!isConnected && (
            <div
              className={`px-4 py-2 text-[11px] border-t ${
                isLightTheme ? 'border-blue-100 text-slate-400' : 'border-gray-800 text-gray-500'
              }`}
            >
              Connect your wallet to switch networks
            </div>
          )}
        </div>
      )}

      {/* Trigger button — matches nav item styling */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex flex-col items-center justify-center px-4 py-3 transition-all duration-300 ${
          isOpen
            ? 'text-blue-400'
            : isLightTheme
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-gray-400 hover:text-white'
        }`}
        aria-label="Switch network"
        aria-expanded={isOpen}
      >
        <div className="relative text-xl flex items-center justify-center transition-transform duration-300 hover:scale-125">
          {isUnrecognized ? (
            <FiWifi size={20} className="text-yellow-500" />
          ) : (
            <div className="relative w-5 h-5 rounded-full overflow-hidden bg-neutral-800">
              <Image src={displayChain.iconPath} alt={displayChain.name} width={20} height={20} className="object-contain" />
            </div>
          )}
          <FiChevronUp
            size={10}
            className={`absolute -right-2 -bottom-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        <span
          className={`text-xs mt-1 transition-all duration-300 text-center whitespace-nowrap ${
            showLabel ? 'opacity-100' : 'opacity-0 h-0 mt-0'
          }`}
        >
          {isUnrecognized ? 'Wrong Network' : displayChain.testnet ? 'Testnet' : 'Mainnet'}
        </span>
      </button>
    </div>
  );
}
