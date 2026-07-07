'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Star,
  ArrowSquareOut,
  CircleNotch,
  Wallet,
  User,
  Copy,
  Check,
  Globe,
  ClockCounterClockwise,
  FileSearch
} from 'phosphor-react';
import Image from 'next/image';
import { useWallet } from '@/contexts/WalletContext';
import { getSupportedChains, getDefaultChain, ChainId } from '@/config/wallet';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI, ChainKey } from '@/utils/contracts';

interface AuditStats {
  totalAudits: number;
  averageStars: number;
  chainBreakdown: Record<string, number>;
  recentAudits: UserAudit[];
}

interface UserAudit {
  contractHash: string;
  stars: number;
  summary: string;
  timestamp: number;
  chain: ChainId;
}

const StatCard = ({ icon, label, value, unit, className }: { icon: React.ReactNode, label: string, value: string | number, unit?: string, className?: string }) => (
  <div className={`bg-gray-900/50 border border-blue-900/50 rounded-2xl p-6 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-500/10 border border-blue-800/50 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tighter text-white">{value}</p>
          {unit && <p className="text-sm text-gray-400">{unit}</p>}
        </div>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { address, isConnected, provider, connect: connectWallet } = useWallet();
  const [stats, setStats] = useState<AuditStats>({
    totalAudits: 0,
    averageStars: 0,
    chainBreakdown: {},
    recentAudits: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [address]);

  const fetchUserStats = useCallback(async (userAddress: string) => {
    setIsLoading(true);
    try {
      const allAudits: UserAudit[] = [];
      const chainCounts: Record<string, number> = {};
      let totalStars = 0;

      const chainKey: ChainKey = 'blockdagTestnet';
      const contractAddress = CONTRACT_ADDRESSES[chainKey];
      const defaultChain = getDefaultChain();

      if (contractAddress) {
        const readProvider = new ethers.JsonRpcProvider(defaultChain.rpcUrl);
        const contract = new ethers.Contract(contractAddress, AUDIT_REGISTRY_ABI, readProvider);
        
        const history = await contract.getAuditorHistory(userAddress);

        for (const hash of history) {
          const contractAudits = await contract.getContractAudits(hash);
          const userAudits = contractAudits.filter((audit: any) => 
            audit.auditor.toLowerCase() === userAddress.toLowerCase()
          );

          for (const audit of userAudits) {
            allAudits.push({
              contractHash: hash,
              stars: Number(audit.stars),
              summary: audit.summary,
              timestamp: Number(audit.timestamp),
              chain: chainKey
            });

            chainCounts[chainKey] = (chainCounts[chainKey] || 0) + 1;
            totalStars += Number(audit.stars);
          }
        }
      }

      const totalAudits = allAudits.length;

      setStats({
        totalAudits,
        averageStars: totalAudits > 0 ? totalStars / totalAudits : 0,
        chainBreakdown: chainCounts,
        recentAudits: allAudits
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStats({ totalAudits: 0, averageStars: 0, chainBreakdown: {}, recentAudits: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserStats(address);
    } else {
        setIsLoading(false);
    }
  }, [isConnected, address, fetchUserStats]);

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white font-sans">
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
          <CircleNotch size={96} className="text-blue-400 animate-spin" weight="duotone" />
        </div>
        <p className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-500">Fetching Your Stats...</p>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    );
  }

  if (!address) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg mx-auto bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-spotlight-radial-gradient opacity-20"></div>
          
          <div className="relative z-10">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl"></div>
              <div className="relative w-20 h-20 bg-gray-900 border border-gray-700 rounded-full flex items-center justify-center">
                <Wallet size={40} className="text-blue-400" weight="duotone" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tighter">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Connect your wallet to view your personalized audit history and statistics on the BlockDAG network.
            </p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20 flex items-center justify-center mx-auto gap-2"
            >
              <Wallet size={20} />
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const defaultChain = getDefaultChain();

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      <div className="absolute inset-0 bg-spotlight-radial-gradient opacity-20"></div>
      
      <main className="container mx-auto p-4 md:p-8 lg:p-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
              Auditor Profile
            </h1>
            <div 
              className="flex items-center gap-2 mt-3 group cursor-pointer"
              onClick={handleCopy}
            >
              <p className="text-gray-400 font-mono text-sm md:text-base break-all group-hover:text-white transition-colors">
                {address}
              </p>
              <button className="text-gray-500 group-hover:text-blue-400 transition-colors">
                {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <StatCard 
              icon={<User size={24} className="text-blue-400" weight="duotone" />}
              label="Total Audits"
              value={stats.totalAudits}
            />
            <StatCard 
              icon={<Star size={24} className="text-yellow-400" weight="duotone" />}
              label="Average Rating"
              value={stats.averageStars.toFixed(2)}
              unit="/ 5.00"
            />

            {/* Chain Distribution */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-blue-500/10 border border-blue-800/50 rounded-full">
                  <Globe size={24} className="text-blue-400" weight="duotone" />
                </div>
                <h2 className="text-2xl font-bold tracking-tighter">Chain Distribution</h2>
              </div>
              <div className="space-y-4">
                  {Object.entries(stats.chainBreakdown).length > 0 ? Object.entries(stats.chainBreakdown).map(([chainKey, count]) => {
                    const chain = getSupportedChains().find(c => c.key === chainKey);
                    return (
                      <div key={chainKey} className="flex items-center space-x-4">
                        <Image
                          src={chain?.iconPath || ''}
                          alt={chain?.name || 'Chain'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-white">{chain?.name}</span>
                            <span className="text-sm text-gray-400">{count} {count === 1 ? 'audit' : 'audits'}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{
                                width: `${(stats.totalAudits > 0 ? (count / stats.totalAudits) * 100 : 0)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                     <p className="text-center text-gray-500 py-4">No audit data available.</p>
                  )}
                </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 border border-blue-800/50 rounded-full">
                  <ClockCounterClockwise size={24} className="text-blue-400" weight="duotone" />
                </div>
                <h2 className="text-2xl font-bold tracking-tighter">Recent Audits</h2>
              </div>
              <div className="space-y-4">
                {stats.recentAudits.length > 0 ? (
                  stats.recentAudits.map((audit, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/70 border border-gray-700/80 rounded-xl p-4 transition-all duration-300 hover:bg-gray-800/80 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                        <a 
                          href={`${defaultChain.explorerUrl}/address/${audit.contractHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 font-mono text-sm text-gray-400 break-all pr-4 hover:text-blue-400 transition-colors"
                        >
                          {audit.contractHash}
                          <ArrowSquareOut size={14} weight="bold" />
                        </a>
                        <div className="flex items-center gap-1 text-gray-200 flex-shrink-0 bg-gray-700/50 px-2 py-1 rounded-full border border-gray-600/50">
                          <span className="font-bold text-white text-sm">{audit.stars.toFixed(1)}</span>
                          <Star weight="fill" size={14} />
                        </div>
                      </div>
                      <p className="text-gray-300 mb-3 text-base">{audit.summary}</p>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <Image
                            src={getSupportedChains().find(c => c.key === audit.chain)?.iconPath || ''}
                            alt={getSupportedChains().find(c => c.key === audit.chain)?.name || 'Chain'}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span className="text-gray-400">{getSupportedChains().find(c => c.key === audit.chain)?.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(audit.timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                    <FileSearch size={48} className="mx-auto mb-4 text-gray-600" weight="duotone" />
                    <p className="font-bold text-lg text-gray-400">No Audits Found</p>
                    <p className="text-sm">You haven't performed any audits on the BlockDAG Testnet yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}