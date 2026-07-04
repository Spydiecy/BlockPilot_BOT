// Set wallet connection state in a cookie
export const setWalletConnected = (connected: boolean) => {
  if (typeof document !== 'undefined') {
    if (connected) {
      document.cookie = 'wallet-connected=true; path=/; max-age=86400; samesite=lax';
    } else {
      document.cookie = 'wallet-connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax';
    }
  }
};

// Check if wallet is connected
export const isWalletConnected = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((item) => item.trim().startsWith('wallet-connected='));
};

// Format address for display
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format balance for display
export const formatBalance = (balance: string): string => {
  return parseFloat(balance).toFixed(4);
};
