'use client';

import { createContext, useContext, useEffect, ReactNode, useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { formatBalance, getChain, getDefaultChain, getSupportedChains, type SupportedChain } from '@/config/wallet';
import type { EthereumProvider } from '@/types/ethereum';
import { setWalletConnected } from '@/utils/walletUtils';

// Type guard for Ethereum provider
const isEthereumProvider = (provider: unknown): provider is EthereumProvider => {
  const ethereum = provider as EthereumProvider;
  return (
    ethereum &&
    typeof ethereum.request === 'function' &&
    typeof ethereum.on === 'function' &&
    typeof ethereum.removeListener === 'function'
  );
};

// Safe way to get ethereum provider
const getEthereum = (): EthereumProvider | undefined => {
  if (typeof window === 'undefined') return undefined;
  const provider = window.ethereum;
  return isEthereumProvider(provider) ? provider : undefined;
};

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  currentChain: SupportedChain | undefined;
  balance: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  isAuthenticated: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [currentChain, setCurrentChain] = useState<SupportedChain | undefined>();
  
  const router = useRouter();

  // Check if wallet is connected on mount and set up listeners
  useEffect(() => {
    const checkConnection = async () => {
      const ethereum = getEthereum();
      if (!ethereum) return;

      try {
        const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[];
        if (accounts?.length) {
          await handleAccountsChanged(accounts);
          
          // Get current chain ID
          const chainId = await ethereum.request({ method: 'eth_chainId' }) as string;
          handleChainChanged(chainId);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    // Set up event listeners
    const ethereum = getEthereum();
    if (!ethereum) return;
    
    // Type-safe event listeners
    const handleAccountsChangedEvent = (accounts: unknown) => {
      handleAccountsChanged(Array.isArray(accounts) ? accounts : []);
    };
    
    const handleChainChangedEvent = (chainId: unknown) => {
      handleChainChanged(String(chainId));
    };
    
    ethereum.on('accountsChanged', handleAccountsChangedEvent);
    ethereum.on('chainChanged', handleChainChangedEvent);
    
    // Initial check
    checkConnection();
    // After checking connection, if connected, set the cookie
    (async () => {
      const ethereum = getEthereum();
      if (ethereum) {
        try {
          const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[];
          if (accounts?.length) {
            setWalletConnected(true);
          } else {
            setWalletConnected(false);
          }
        } catch {}
      }
    })();
    
    // Cleanup
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChangedEvent);
        ethereum.removeListener('chainChanged', handleChainChangedEvent);
      }
    };
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    const validAccounts = Array.isArray(accounts) 
      ? accounts.filter(account => typeof account === 'string' && account.length > 0)
      : [];
      
    if (validAccounts.length === 0) {
      // Disconnected
      setAddress(null);
      setBalance(null);
      setIsAuthenticated(false);
      setCurrentChain(undefined);
      setWalletConnected(false); // clear cookie on disconnect
      router.push('/');
    } else {
      // Connected or switched account
      const account = validAccounts[0];
      setAddress(account);
      setIsAuthenticated(true);
      setWalletConnected(true); // set cookie on connect
      // Update balance
      const ethereum = getEthereum();
      if (ethereum) {
        await updateBalance(account);
      }
    }
  }, [router]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex.startsWith('0x') ? chainIdHex : `0x${chainIdHex}`, 16);
    setChainId(chainId);
    
    const supportedChain = getSupportedChains().find(c => c.id === chainId);
    if (supportedChain) {
      setCurrentChain(supportedChain);
    } else {
      console.warn('Unsupported chain ID:', chainId);
      setCurrentChain(undefined);
    }
  }, []);

  // Update balance for an account
  const updateBalance = useCallback(async (account: string) => {
    if (!provider) return;
    
    try {
      const balance = await provider.getBalance(account);
      setBalance(formatBalance(balance.toString()));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, [provider]);

  // Connect wallet
  const connect = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    }
    
    try {
      setIsConnecting(true);
      const accounts = (await ethereum.request({ 
        method: 'eth_requestAccounts' 
      })) as string[];
      
      if (accounts?.length) {
        const account = accounts[0];
        setAddress(account);
        setIsAuthenticated(true);
        setWalletConnected(true); // Set cookie on connect
        
        // Check and switch network if necessary
        const defaultChain = getDefaultChain();
        const currentChainId = parseInt(await ethereum.request({ method: 'eth_chainId' }) as string, 16);

        if (currentChain?.id !== defaultChain.id) {
          await switchChain(defaultChain.id);
          // After the switch attempt, the chainChanged event will trigger a state update.
          // We don't need to check the return value here.
        }
        await updateBalance(account);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    // Note: Most wallets don't have a disconnect method, we just clear the state
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setCurrentChain(undefined);
    setIsAuthenticated(false);
    setWalletConnected(false); // Clear cookie on disconnect
    router.push('/wallet');
  };

  // Switch to a different chain
  const switchChain = async (targetChainId: number): Promise<void> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          const chain = getChain(targetChainId);
          if (!chain) throw new Error('Unsupported chain');
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: {
                name: chain.currency,
                symbol: chain.currency,
                decimals: 18,
              },
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.explorerUrl],
            }],
          });
        } catch (addError) {
          console.error('Target chain configuration not found');
          return;
        }
      } else {
        console.error('Error switching chain:', switchError);
        throw switchError;
      }
    }
  };

  useEffect(() => {
    const ethereum = getEthereum();
    if (ethereum) {
      const web3Provider = new ethers.BrowserProvider(ethereum as any);
      setProvider(web3Provider);
      if (address) {
        const getSigner = async () => {
          const web3Signer = await web3Provider.getSigner();
          setSigner(web3Signer);
        }
        getSigner();
      }
    }
  }, [address]);

  // Expose the wallet context
  const value = {
    isConnected: isAuthenticated,
    isConnecting,
    address,
    chainId,
    currentChain,
    balance,
    provider,
    signer,
    connect,
    disconnect,
    switchChain,
    isAuthenticated,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
