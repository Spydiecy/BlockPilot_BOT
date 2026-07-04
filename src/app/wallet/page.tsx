'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiCopy, 
  FiExternalLink, 
  FiCheck, 
  FiLogOut,
  FiAlertTriangle,
  FiShield,
  FiZap,
  FiDownload,
  FiLink
} from 'react-icons/fi';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress, formatBalance, getSupportedChains } from '@/config/wallet';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// Using formatAddress and formatBalance from @/config/wallet

export default function WalletPage() {
  const router = useRouter();
  
  // Wallet connection state
  const { 
    isConnected, 
    isConnecting, 
    address, 
    chainId, 
    currentChain, 
    balance,
    disconnect 
  } = useWallet();

  // Local state
  const [copied, setCopied] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'security'>('wallet');
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showTestnetWarning, setShowTestnetWarning] = useState(false);
  const [isTestnet, setIsTestnet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle copy address to clipboard
  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [address]);
  
  // Handle disconnect confirmation
  const confirmDisconnect = useCallback(() => {
    disconnect();
    setShowDisconnectModal(false);
  }, [disconnect]);

  // Format address for display
  const formattedAddress = address ? formatAddress(address) : '';
  
  // Get current chain name
  const chainName = currentChain?.name || 'Unknown Network';

  // Handle copy to clipboard
  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  // Check if current network is testnet
  useEffect(() => {
    if (!chainId) return;
    const isTestnetChain = [5, 80001, 11155111].includes(chainId);
    setIsTestnet(isTestnetChain);
    setShowTestnetWarning(isTestnetChain);
  }, [chainId]);

  // Show backup reminder if account is new
  useEffect(() => {
    if (isConnected && address) {
      // In a real app, you might check local storage or an API to see if this is a new account
      const isNewAccount = localStorage.getItem(`account_${address}`) === null;
      if (isNewAccount) {
        setShowBackupReminder(true);
        localStorage.setItem(`account_${address}`, 'backup_reminder_shown');
      }
    }
  }, [isConnected, address]);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      router.push('/');
    }
  }, [isConnected, isConnecting, router]);

  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Wallet Not Connected</h1>
          <p className="mb-6">Please connect your wallet to continue.</p>
          <div className="flex justify-center">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-100"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-md mx-auto"
        >
          {/* Back Button */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back
            </button>
            <WalletConnectButton />
          </div>
          {/* Main Card */}
          <motion.div variants={itemVariants}>
            <div className="border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-800/30 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">
              <div className="text-center p-8 space-y-3 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                <motion.div 
                  variants={itemVariants}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/20"
                >
                  <FiShield className="h-8 w-8 text-indigo-400" />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                    {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                  </h2>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    {isConnected 
                      ? 'Manage your wallet and view your assets' 
                      : 'Connect your wallet to access all features'}
                  </p>
                </motion.div>
              </div>

              <div className="p-6 space-y-6">
                {!isConnected ? (
                  <motion.div 
                    variants={itemVariants}
                    className="flex flex-col items-center space-y-6"
                  >
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm w-full">
                        {error}
                      </div>
                    )}
                    
                    <div className="w-full">
                      <WalletConnectButton className="w-full" />
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center px-4">
                      By connecting your wallet, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                  >
                    {/* Wallet Balance */}
                    <motion.div variants={itemVariants}>
                      <div className="rounded-lg bg-gray-800/50 p-4 border border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-400">Wallet Address</span>
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-green-400">Connected</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm" title={address || ''}>
                            {formatAddress(address || '')}
                          </div>
                          <button
                            onClick={() => {
                              if (address) {
                                navigator.clipboard.writeText(address);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }
                            }}
                            title={copied ? 'Copied!' : 'Copy address'}
                            className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
                          >
                            {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Wallet Balance */}
                    {balance && (
                      <motion.div variants={itemVariants}>
                        <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/5 p-5 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-400/30 transition-all duration-300">
                          <div className="text-sm font-medium text-gray-400 mb-1">Balance</div>
                          <div className="flex items-baseline space-x-2">
                            <div className="text-sm text-gray-400">
                              {currentChain?.name} • {currentChain?.testnet ? 'Testnet' : 'Mainnet'}
                            </div>
                            <span className="text-2xl font-bold">
                              {formatBalance(balance)}
                            </span>
                            <span className="text-indigo-400">ETH</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Network */}
                    {currentChain && (
                      <motion.div variants={itemVariants}>
                        <div className="rounded-xl bg-gray-800/30 p-5 border border-gray-800/50 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300">
                          <div className="text-sm font-medium text-gray-400 mb-1">Network</div>
                          <div className="flex items-center">
                            <FiZap className="h-4 w-4 text-yellow-400 mr-2" />
                            <span className="font-medium">{currentChain.name}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div variants={itemVariants} className="pt-2 space-y-3">
                      <a
                        href={`https://${currentChain?.testnet ? `${currentChain.name.toLowerCase()}.` : ''}${currentChain?.explorerUrl?.replace('https://', '').split('/')[0] || 'etherscan.io'}/address/${address || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-6 py-3 text-sm font-medium text-gray-200 hover:text-white bg-gradient-to-r from-indigo-500/10 to-purple-500/5 hover:from-indigo-500/20 hover:to-purple-500/10 rounded-xl border border-gray-800 hover:border-indigo-500/30 transition-all duration-300"
                      >
                        <FiExternalLink className="mr-2 h-4 w-4" />
                        View on Explorer
                      </a>
                      
                      <button
                        onClick={() => setShowDisconnectModal(true)}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500/10 to-pink-500/5 hover:from-red-500/20 hover:to-pink-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 text-sm font-medium"
                      >
                        <FiLogOut className="mr-2 h-4 w-4" />
                        Disconnect Wallet
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Disconnect Confirmation Modal */}
        <AnimatePresence>
          {showDisconnectModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-800/50 p-6 w-full max-w-sm backdrop-blur-xl shadow-2xl shadow-purple-500/10"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-red-500/20 mr-3">
                    <FiAlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium">Disconnect Wallet</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  Are you sure you want to disconnect your wallet? You'll need to reconnect to access protected features.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDisconnectModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 rounded-xl hover:bg-gray-800/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDisconnect}
                    className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all duration-300"
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
