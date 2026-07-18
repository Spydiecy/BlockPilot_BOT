'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCopy, IconCheck, IconLogout, IconWallet, IconArrowLeft } from '@tabler/icons-react';
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

function WalletPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
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
    const isTestnetChain = [5, 80001, 11155111, 4202].includes(chainId); // Added Lisk Sepolia (4202)
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

  // Handle redirect after wallet connection
  useEffect(() => {
    if (isConnected && redirectTo && redirectTo !== '/wallet') {
      // Set wallet connected cookie
      document.cookie = 'wallet-connected=true; path=/; max-age=86400'; // 24 hours
      
      // Small delay to ensure everything is properly set up
      const timer = setTimeout(() => {
        router.push(redirectTo);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, redirectTo, router]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-neutral-900/50 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-5xl font-bold text-white">
              Wallet
            </h1>
            <p className="text-neutral-400 mt-2">
              Manage your wallet connection and assets.
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-black border border-neutral-800 rounded-xl shadow-2xl shadow-blue-500/5"
          >
            {isConnected && address ? (
              <div className="p-6 space-y-6">
                {/* Address Section */}
                <div>
                  <label className="text-xs text-blue-400 uppercase tracking-wider">Wallet Address</label>
                  <div className="flex items-center justify-between mt-2 bg-neutral-900 p-3 rounded-md border border-neutral-700">
                    <span className="font-mono text-sm text-neutral-300">{formattedAddress}</span>
                    <button onClick={copyAddress} className="text-neutral-400 hover:text-white transition-colors">
                      {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </button>
                  </div>
                </div>

                {/* Balance & Network */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-blue-400 uppercase tracking-wider">Balance</label>
                    <p className="text-2xl font-semibold text-white mt-1">{balance ? formatBalance(balance) : '0.00'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-400 uppercase tracking-wider">Network</label>
                    <p className="text-lg font-medium text-neutral-300 mt-2 flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2.5 ${isTestnet ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                      {chainName}
                    </p>
                  </div>
                </div>

                {/* Disconnect Button */}
                <button 
                  onClick={() => setShowDisconnectModal(true)} 
                  className="w-full mt-2 bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3 rounded-lg hover:bg-neutral-800 hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <IconLogout size={16} className="mr-2"/>
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="p-8 text-center space-y-6">
                <IconWallet size={48} className="mx-auto text-blue-400"/>
                <p className="text-neutral-300">Connect your wallet to manage your assets.</p>
                <WalletConnectButton />
              </div>
            )}
          </motion.div>

          {/* Back to Home Button */}
          <motion.div variants={itemVariants} className="text-center">
            <button onClick={() => router.push('/')} className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium flex items-center justify-center mx-auto">
              <IconArrowLeft size={14} className="mr-1.5" />
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Disconnect Modal */}
      <AnimatePresence>
        {showDisconnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-neutral-800 rounded-xl p-6 w-full max-w-sm text-center shadow-xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Disconnect Wallet?</h3>
              <p className="text-neutral-400 mb-6">Are you sure you want to disconnect?</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowDisconnectModal(false)} 
                  className="w-full bg-neutral-800 text-white py-2.5 rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDisconnect} 
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-500 transition-colors font-semibold"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </main>
    }>
      <WalletPageContent />
    </Suspense>
  );
}
