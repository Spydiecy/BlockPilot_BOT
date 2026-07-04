// Type definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isConnected: () => boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      chainId: string;
      selectedAddress: string | null;
    };
  }
}

export type EthereumProvider = NonNullable<Window['ethereum']>;
