import { ethers } from 'ethers';

// Define chain interface
export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
  testnet?: boolean;
}

// Supported chains configuration
export const SUPPORTED_CHAINS = {
  blockdagTestnet: {
    id: 1043,
    name: 'BlockDAG Testnet',
    rpcUrl: 'https://rpc.primordial.bdagscan.com',
    explorerUrl: 'https://primordial.bdagscan.com',
    currency: 'BDAG',
    testnet: true,
  },
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    currency: 'ETH',
    testnet: false,
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    currency: 'MATIC',
    testnet: false,
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    currency: 'ETH',
    testnet: false,
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    currency: 'ETH',
    testnet: false,
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;
export type SupportedChain = typeof SUPPORTED_CHAINS[ChainId];

// Default chain to use
const DEFAULT_CHAIN: ChainId = 'blockdagTestnet';

// Helper to get chain by ID
export const getChainById = (chainId: number): SupportedChain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
};

// Helper to get chain by name
export const getChainByName = (name: string): SupportedChain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find(
    chain => chain.name.toLowerCase() === name.toLowerCase()
  );
};

// Format address for display
export const formatAddress = (address: string, length = 6): string => {
  if (!address) return '';
  return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
};

// Format balance with appropriate decimals
export const formatBalance = (balance: string | number | undefined, decimals = 4): string => {
  if (balance === undefined || balance === null) return '0.0000';

  try {
    // ethers.formatEther can handle BigInt, hex strings, and numbers representing wei
    const formatted = ethers.formatEther(balance);
    const num = parseFloat(formatted);
    return num.toFixed(decimals);
  } catch (error) {
    // If formatEther fails, it's likely because the value is already a decimal string like "79.9694"
    const balanceAsNumber = parseFloat(balance.toString());
    if (!isNaN(balanceAsNumber)) {
      return balanceAsNumber.toFixed(decimals);
    }
    console.error('Could not format balance:', balance, error);
    return '0.0000';
  }
};

// Get default chain configuration
export const getDefaultChain = (): SupportedChain => {
  return SUPPORTED_CHAINS[DEFAULT_CHAIN];
};

// Get all supported chains
export const getSupportedChains = (): SupportedChain[] => {
  return Object.values(SUPPORTED_CHAINS);
};

// Get chain by ID or return default
export const getChain = (chainId?: number): SupportedChain => {
  if (!chainId) return getDefaultChain();
  return getChainById(chainId) || getDefaultChain();
};
