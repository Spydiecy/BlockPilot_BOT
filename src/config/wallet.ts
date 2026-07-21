import { ethers } from 'ethers';

// Define chain interface
export interface Chain {
  id: number;
  key: ChainId;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
  iconPath: string;
  testnet?: boolean;
}

// Supported chains configuration
export const SUPPORTED_CHAINS = {
  polygonAmoy: {
    id: 80002,
    key: 'polygonAmoy',
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    currency: 'POL',
    iconPath: '/chains/polygon.png',
    testnet: true,
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;
export type SupportedChain = typeof SUPPORTED_CHAINS[ChainId];

// Default chain to use
const DEFAULT_CHAIN: ChainId = 'polygonAmoy';

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
