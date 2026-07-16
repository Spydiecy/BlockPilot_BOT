'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { 
  MagnifyingGlass, 
  Star, 
  ArrowSquareOut,
  X,
  FunnelSimple,
  Download,
  FileText,
  ListChecks,
  CircleNotch,
  Copy
} from 'phosphor-react';
import Image from 'next/image';
import { SUPPORTED_CHAINS, ChainId } from '@/config/wallet';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI, ChainKey } from '@/utils/contracts';

interface AuditReport {
  contractHash: string;
  transactionHash: string;
  stars: number;
  summary: string;
  auditor: string;
  timestamp: number;
  chain: ChainKey;
}

interface FilterState {
  search: string;
  chain: string;
  dateRange: 'all' | 'day' | 'week' | 'month';
  minStars: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    chain: 'all',
    dateRange: 'all',
    minStars: 0
  });

  // Fetch audits from all supported chains
  const fetchAllChainAudits = async () => {
    setIsLoading(true);
    try {
      const allAudits: AuditReport[] = [];
      
      try {
        console.log('Fetching audit reports from Lisk Sepolia Testnet...');
        
        // First get the total number of contracts
        const totalResponse = await fetch('/api/blockchain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'getTotalContracts',
            params: []
          })
        });
        
        if (!totalResponse.ok) {
          throw new Error('Failed to get total contracts');
        }
        
        const totalData = await totalResponse.json();
        const totalContracts = totalData.result;
        console.log(`Found ${totalContracts} contracts on Lisk Sepolia Testnet`);
        
        // Fetch in batches to respect rate limits
        const BATCH_SIZE = 10; 
        let processed = 0;
        
        while (processed < totalContracts) {
          try {
            const response = await fetch('/api/blockchain', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                method: 'getAllAudits',
                params: [{
                  startIndex: processed,
                  limit: BATCH_SIZE
                }]
              })
            });
            
            if (!response.ok) {
              console.warn(`Failed to fetch batch ${processed}-${processed + BATCH_SIZE}: ${response.statusText}`);
              break;
            }
            
            const data = await response.json();
            console.log(`Fetched batch ${processed}-${processed + BATCH_SIZE}, found ${data.result.length} audits`);
            
            const batchAudits = data.result.map((audit: any) => ({
              contractHash: audit.contractHash,
              transactionHash: audit.transactionHash || "0x",
              stars: Number(audit.stars),
              summary: audit.summary,
              auditor: audit.auditor,
              timestamp: Number(audit.timestamp),
              chain: 'liskTestnet' as ChainKey
            }));
            
            allAudits.push(...batchAudits);
            processed += BATCH_SIZE;
            
            // Small delay to avoid overwhelming the RPC
            if (processed < totalContracts) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(`Error fetching batch ${processed}:`, error);
            break;
          }
        }
        
        console.log(`Total audits fetched: ${allAudits.length}`);
      } catch (error) {
        console.error('Error fetching Lisk Sepolia audits:', error);
      }
      
      setReports(allAudits);
    } catch (error) {
      console.error('Error fetching all chain audits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChainAudits();
  }, []);

  const getFilteredReports = () => {
    const filtered = reports.filter(report => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesHash = report.contractHash.toLowerCase().includes(searchLower);
        const matchesAuditor = report.auditor.toLowerCase().includes(searchLower);
        if (!matchesHash && !matchesAuditor) return false;
      }

      // Chain filter
      if (filters.chain !== 'all' && report.chain !== filters.chain) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = Date.now() / 1000;
        const reportTime = report.timestamp;
        const daySeconds = 86400;
        
        switch (filters.dateRange) {
          case 'day':
            if (now - reportTime > daySeconds) return false;
            break;
          case 'week':
            if (now - reportTime > daySeconds * 7) return false;
            break;
          case 'month':
            if (now - reportTime > daySeconds * 30) return false;
            break;
        }
      }

      // Stars filter
      if (report.stars < filters.minStars) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const exportReport = (report: AuditReport) => {
    // Convert BigInt values and format data for export
    const formattedReport = {
      contractHash: report.contractHash,
      stars: Number(report.stars),
      summary: report.summary,
      auditor: report.auditor,
      timestamp: Number(report.timestamp),
      chain: report.chain,
      chainName: SUPPORTED_CHAINS[report.chain as ChainId].name,
      exportDate: new Date().toISOString(),
      network: {
        name: SUPPORTED_CHAINS[report.chain as ChainId].name,
        id: SUPPORTED_CHAINS[report.chain as ChainId].id,
        contractAddress: CONTRACT_ADDRESSES[report.chain],
      },
      auditDate: new Date(Number(report.timestamp) * 1000).toLocaleString(),
    };
  
    // Create and download the file
    try {
      const blob = new Blob([JSON.stringify(formattedReport, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${report.contractHash.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]"
      ></div>
      <div className="absolute inset-0 h-full w-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
              <FileText size={24} className="text-blue-400" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tighter">Audit Reports</h1>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" 
                weight="bold" 
              />
              <input
                type="text"
                placeholder="Search by contract hash or auditor..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-black/50 border border-blue-900/50 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-white placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl border transition-all duration-200 flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                  : 'bg-black/50 border-blue-900/50 text-blue-400 hover:border-blue-500/50'
              }`}
            >
              <FunnelSimple size={20} weight="bold" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-black/50 border border-blue-900/50 rounded-2xl p-4 shadow-lg shadow-blue-500/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-blue-400 mb-2">Chain</label>
                  <select
                    value={filters.chain}
                    onChange={(e) => setFilters({ ...filters, chain: e.target.value })}
                    className="w-full bg-black/50 border border-blue-900/50 rounded-2xl px-3 py-2 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-white"
                  >
                    <option value="all">All Chains</option>
                    {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                      <option key={key} value={key}>{chain.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-blue-400 mb-2">Time Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })}
                    className="w-full bg-black/50 border border-blue-900/50 rounded-2xl px-3 py-2 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-blue-400 mb-2">Minimum Stars</label>
                  <select
                    value={filters.minStars}
                    onChange={(e) => setFilters({ ...filters, minStars: Number(e.target.value) })}
                    className="w-full bg-black/50 border border-blue-900/50 rounded-2xl px-3 py-2 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-white"
                  >
                    <option value={0}>Any Rating</option>
                    {[1, 2, 3, 4, 5].map(stars => (
                      <option key={stars} value={stars}>{stars}+ Stars</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Reports Table */}
        <div className="bg-black/50 border border-blue-900/50 hover:border-blue-500/30 transition-colors duration-300 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/10">
          <div 
            className="overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#3b82f6 #1e293b'
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                .overflow-x-auto::-webkit-scrollbar {
                  height: 8px;
                }
                .overflow-x-auto::-webkit-scrollbar-track {
                  background: #1e293b;
                  border-radius: 4px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb {
                  background: #3b82f6;
                  border-radius: 4px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                  background: #2563eb;
                }
              `
            }} />
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-900/50">
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">CONTRACT HASH</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">CHAIN</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">RATING</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">AUDITOR</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">DATE</th>
                  <th className="py-4 px-6 text-right text-sm font-mono text-blue-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr 
                    key={`${report.contractHash}-${report.chain}`}
                    className="border-b border-blue-900/50 hover:bg-blue-500/5 transition-colors duration-200"
                  >
                    <td className="py-4 px-6 font-mono text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">
                          {report.contractHash ? (
                            `${report.contractHash.slice(0, 10)}...${report.contractHash.slice(-8)}`
                          ) : (
                            'N/A'
                          )}
                        </span>
                        {report.contractHash && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(report.contractHash);
                            }}
                            className="p-1 hover:bg-blue-500/20 rounded transition-colors duration-200"
                            title="Copy contract hash"
                          >
                            <Copy size={14} weight="bold" className="text-blue-400" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[2px]"></div>
                          <Image
                            src={SUPPORTED_CHAINS[report.chain].iconPath}
                            alt={SUPPORTED_CHAINS[report.chain].name}
                            width={20}
                            height={20}
                            className="rounded-full relative z-10"
                          />
                        </div>
                        <span className="text-white">{SUPPORTED_CHAINS[report.chain].name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            weight={i < report.stars ? "fill" : "regular"}
                            className={i < report.stars ? "text-blue-400" : "text-blue-600"}
                            size={16}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-blue-400">
                      {report.auditor ? `${report.auditor.slice(0, 6)}...${report.auditor.slice(-4)}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-blue-400">
                      {report.timestamp ? new Date(report.timestamp * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 hover:bg-blue-500/20 rounded-2xl transition-colors duration-200"
                          title="View Details"
                        >
                          <ArrowSquareOut size={20} className="text-blue-400" weight="bold" />
                        </button>
                        <button
                          onClick={() => exportReport(report)}
                          className="p-2 hover:bg-blue-500/20 rounded-2xl transition-colors duration-200"
                          title="Export Report"
                        >
                          <Download size={20} className="text-blue-400" weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-2xl">
                <CircleNotch className="animate-spin mr-2" size={20} weight="bold" />
                Loading audits...
              </div>
            </div>
          )}

          {!isLoading && filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-2xl">
                <ListChecks className="mr-2" size={20} weight="bold" />
                No audit reports found matching your criteria
              </div>
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/90 border border-blue-900/50 rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl shadow-blue-900/10 backdrop-blur-sm"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="inline-block mb-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/20">
                      <span className="text-blue-400 text-xs font-medium">Audit Details</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Contract Security Report</h3>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-1 hover:bg-blue-800/50 rounded-2xl transition-colors duration-200 hover:text-blue-400 text-white"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                <div 
                  className="space-y-6 max-h-[60vh] overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#3b82f6 #1e293b'
                  }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .space-y-6::-webkit-scrollbar {
                        width: 8px;
                      }
                      .space-y-6::-webkit-scrollbar-track {
                        background: #1e293b;
                        border-radius: 4px;
                      }
                      .space-y-6::-webkit-scrollbar-thumb {
                        background: #3b82f6;
                        border-radius: 4px;
                      }
                      .space-y-6::-webkit-scrollbar-thumb:hover {
                        background: #2563eb;
                      }
                    `
                  }} />
                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Contract Hash</label>
                    <div className="font-mono bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40 flex items-center justify-between text-white">
                      <span className="truncate">
                        {selectedReport.contractHash || 'N/A'}
                      </span>
                      {selectedReport.contractHash && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedReport.contractHash);
                          }}
                          className="ml-2 p-1.5 hover:bg-blue-500/30 rounded-md transition-colors duration-200"
                          title="Copy contract hash"
                        >
                          <Copy size={18} weight="bold" className="text-blue-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Transaction Hash</label>
                    <div className="font-mono bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40 flex items-center justify-between text-white">
                      <span className="truncate">
                        {selectedReport.transactionHash && selectedReport.transactionHash !== "0x" ? (
                          `${selectedReport.transactionHash.slice(0, 28)}...${selectedReport.transactionHash.slice(-24)}`
                        ) : (
                          'N/A'
                        )}
                      </span>
                      {selectedReport.transactionHash && selectedReport.transactionHash !== "0x" && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedReport.transactionHash);
                          }}
                          className="ml-2 p-1.5 hover:bg-blue-500/30 rounded-md transition-colors duration-200"
                          title="Copy transaction hash"
                        >
                          <Copy size={18} weight="bold" className="text-blue-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Chain</label>
                    <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[2px]"></div>
                        <Image
                          src={SUPPORTED_CHAINS[selectedReport.chain].iconPath}
                          alt={SUPPORTED_CHAINS[selectedReport.chain].name}
                          width={20}
                          height={20}
                          className="rounded-full relative z-10"
                        />
                      </div>
                      <span className="text-white">{SUPPORTED_CHAINS[selectedReport.chain].name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Security Rating</label>
                    <div className="flex gap-1 bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          weight={i < selectedReport.stars ? "fill" : "regular"}
                          className={i < selectedReport.stars ? "text-blue-400" : "text-blue-600"}
                          size={20}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Summary</label>
                    <div className="bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40 text-white">
                      {selectedReport.summary || 'No summary available'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Auditor</label>
                    <div className="font-mono bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40 flex items-center justify-between text-white">
                      <span>{selectedReport.auditor || 'N/A'}</span>
                      {selectedReport.auditor && (
                        <a
                          href={`${SUPPORTED_CHAINS[selectedReport.chain].explorerUrl}/address/${selectedReport.auditor}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors duration-200"
                        >
                          View on Explorer <ArrowSquareOut size={16} weight="bold" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-400 mb-1">Timestamp</label>
                    <div className="bg-black/50 px-3 py-2 rounded-2xl border border-blue-900/40 text-white">
                      {selectedReport.timestamp ? new Date(selectedReport.timestamp * 1000).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-blue-900/50">
                    <button
                      onClick={() => exportReport(selectedReport)}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-2xl hover:bg-blue-500/30 transition-colors duration-200 flex items-center gap-2"
                    >
                      <Download size={20} weight="bold" />
                      Export Report
                    </button>
                    {selectedReport.transactionHash && selectedReport.transactionHash !== "0x" && (
                      <a
                        href={`${SUPPORTED_CHAINS[selectedReport.chain].explorerUrl}/tx/${selectedReport.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-800/50 rounded-2xl hover:bg-blue-900/40 transition-colors duration-200 flex items-center gap-2 text-white"
                      >
                        View on Explorer
                        <ArrowSquareOut size={20} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}