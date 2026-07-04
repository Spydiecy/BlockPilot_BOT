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
const DEFAULT_CHAIN: ChainId = 'ethereum';

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
export const formatBalance = (balance: string | number, decimals = 4): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0';
  
  // Convert from wei to ETH if the number is very large
  const displayValue = num > 1e18 ? num / 1e18 : num;
  
  // Format with fixed decimals, then remove trailing zeros
  return displayValue.toFixed(decimals).replace(/\.?0+$/, '');
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
