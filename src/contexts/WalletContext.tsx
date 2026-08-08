'use client';

import { createContext, useContext, useEffect, ReactNode, useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { formatBalance, getChain, getDefaultChain, getSupportedChains, type SupportedChain } from '@/config/wallet';
import type { EthereumProvider } from '@/types/ethereum';

const setWalletConnected = (connected: boolean) => {
  if (typeof document !== 'undefined') {
    if (connected) {
      document.cookie = 'wallet-connected=true; path=/; max-age=86400; samesite=lax';
    } else {
      document.cookie = 'wallet-connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax';
    }
  }
};

const isEthereumProvider = (provider: unknown): provider is EthereumProvider => {
  const ethereum = provider as EthereumProvider;
  return (
    ethereum &&
    typeof ethereum.request === 'function' &&
    typeof ethereum.on === 'function' &&
    typeof ethereum.removeListener === 'function'
  );
};

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

  // ─── Parse and set chain from hex string ──────────────────────────────────
  const applyChainId = useCallback((chainIdHex: string) => {
    const parsed = chainIdHex.startsWith('0x')
      ? parseInt(chainIdHex, 16)
      : parseInt(chainIdHex, 10);

    setChainId(parsed);

    const match = getSupportedChains().find(c => c.id === parsed);
    setCurrentChain(match ?? undefined);
    if (!match) console.warn('Unsupported chain ID:', parsed);
  }, []);

  // ─── Handle account list change ───────────────────────────────────────────
  const applyAccounts = useCallback(async (accounts: string[]) => {
    const valid = accounts.filter(a => typeof a === 'string' && a.length > 0);

    if (valid.length === 0) {
      setAddress(null);
      setBalance(null);
      setIsAuthenticated(false);
      setCurrentChain(undefined);
      setWalletConnected(false);
      router.push('/');
    } else {
      setAddress(valid[0]);
      setIsAuthenticated(true);
      setWalletConnected(true);
    }
  }, [router]);

  // ─── On mount: read current chain + accounts without asking permission ─────
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const init = async () => {
      try {
        // Always read chain first — no permission required
        const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
        applyChainId(chainHex);

        // Read accounts silently (no popup)
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        await applyAccounts(accounts);
        setWalletConnected(accounts.length > 0);
      } catch (err) {
        console.error('Wallet init error:', err);
      }
    };

    const onAccountsChanged = (accounts: unknown) =>
      applyAccounts(Array.isArray(accounts) ? accounts : []);

    const onChainChanged = (chainId: unknown) =>
      applyChainId(String(chainId));

    ethereum.on('accountsChanged', onAccountsChanged);
    ethereum.on('chainChanged', onChainChanged);
    init();

    return () => {
      ethereum.removeListener('accountsChanged', onAccountsChanged);
      ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [applyChainId, applyAccounts]);

  // ─── Provider + signer whenever address changes ───────────────────────────
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const web3Provider = new ethers.BrowserProvider(ethereum as any);
    setProvider(web3Provider);

    if (address) {
      web3Provider.getSigner().then(setSigner).catch(console.error);
      web3Provider.getBalance(address)
        .then(b => setBalance(formatBalance(b.toString())))
        .catch(() => setBalance(null));
    }
  }, [address]);

  // ─── Connect (requests permission) ───────────────────────────────────────
  const connect = async () => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error('No Ethereum provider found. Please install MetaMask.');

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.length) return;

      const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
      const currentId = parseInt(chainHex, 16);
      const defaultChain = getDefaultChain();

      applyChainId(chainHex);
      await applyAccounts(accounts);

      if (currentId !== defaultChain.id) {
        await switchChain(defaultChain.id);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = async () => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setCurrentChain(undefined);
    setIsAuthenticated(false);
    setWalletConnected(false);
    router.push('/wallet');
  };

  // ─── Switch chain ─────────────────────────────────────────────────────────
  const switchChain = async (targetChainId: number): Promise<void> => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error('No Ethereum provider found');

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const chain = getChain(targetChainId);
        if (!chain) throw new Error('Chain config not found');
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: { name: chain.currency, symbol: chain.currency, decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorerUrl],
          }],
        });
      } else {
        throw switchError;
      }
    }
  };

  const value: WalletContextType = {
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
