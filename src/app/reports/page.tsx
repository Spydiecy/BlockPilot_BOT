'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { 
  MagnifyingGlass, 
  Star, 
  ArrowSquareOut,
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
import { generateAuditPDF } from '@/utils/generatePDF';

const ALL_CHAIN_KEYS = Object.keys(CONTRACT_ADDRESSES) as ChainKey[];

interface AuditReport {
  contractHash: string;
  transactionHash: string; // Transaction hash from blockchain event
  stars: number;
  summary: string;
  auditor: string;
  timestamp: number;
  chain: ChainKey;
  // New fields from updated contract
  criticalIssues?: number;
  highIssues?: number;
  mediumIssues?: number;
  reportCID?: string;  // IPFS CID
  analysisJobId?: string;
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    chain: 'all',
    dateRange: 'all',
    minStars: 0
  });

  // Fetch audits from every supported chain (mainnet + testnet) and tag each with its chain
  const fetchChainAudits = async (chainKey: ChainKey): Promise<AuditReport[]> => {
    const chainName = SUPPORTED_CHAINS[chainKey]?.name || chainKey;
    const chainAudits: AuditReport[] = [];

    try {
      console.log(`Fetching audit reports from ${chainName}...`);

      const totalResponse = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'getTotalContracts', params: [], chain: chainKey }),
      });

      if (!totalResponse.ok) {
        throw new Error('Failed to get total contracts');
      }

      const totalData = await totalResponse.json();
      const totalContracts = totalData.result;
      console.log(`Found ${totalContracts} contracts on ${chainName}`);

      const BATCH_SIZE = 10;
      let processed = 0;

      while (processed < totalContracts) {
        try {
          const response = await fetch('/api/blockchain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'getAllAudits',
              params: [{ startIndex: processed, limit: BATCH_SIZE }],
              chain: chainKey,
            }),
          });

          if (!response.ok) {
            console.warn(`Failed to fetch batch ${processed}-${processed + BATCH_SIZE} on ${chainName}: ${response.statusText}`);
            break;
          }

          const data = await response.json();
          console.log(`Fetched batch ${processed}-${processed + BATCH_SIZE} on ${chainName}, found ${data.result.length} audits`);

          const batchAudits: AuditReport[] = data.result.map((audit: any) => ({
            contractHash: audit.contractHash || audit.contractHashes?.[0],
            transactionHash: audit.transactionHash || '0x',
            stars: Number(audit.stars),
            summary: audit.summary || audit.summaryPreview || "",
            auditor: audit.auditor || audit.auditors?.[0],
            timestamp: Number(audit.timestamp || audit.timestamps?.[0]),
            chain: chainKey,
            criticalIssues: Number(audit.criticalIssues || 0),
            highIssues: Number(audit.highIssues || 0),
            mediumIssues: Number(audit.mediumIssues || 0),
            reportCID: audit.reportCID || audit.reportCIDs?.[0],
            analysisJobId: audit.analysisJobId || audit.analysisJobIds?.[0]
          }));

          chainAudits.push(...batchAudits);
          processed += BATCH_SIZE;

          if (processed < totalContracts) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error fetching batch ${processed} on ${chainName}:`, error);
          break;
        }
      }

      console.log(`Total audits fetched on ${chainName}: ${chainAudits.length}`);
    } catch (error) {
      console.error(`Error fetching ${chainName} audits:`, error);
    }

    return chainAudits;
  };

  // Fetch audits from all supported chains
  const fetchAllChainAudits = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(ALL_CHAIN_KEYS.map(fetchChainAudits));
      setReports(results.flat());
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

  const exportReport = async (report: AuditReport) => {
    // Fetch full report from IPFS if available
    if (report.reportCID) {
      try {
        const response = await fetch('/api/ipfs/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cid: report.reportCID }),
        });

        if (response.ok) {
          const data = await response.json();
          // Generate PDF with full report data
          generateAuditPDF(
            data.report.analysis,
            data.report.contractCode,
            report.transactionHash !== '0x' ? report.transactionHash : null
          );
          return;
        }
      } catch (error) {
        console.error('Error fetching full report:', error);
      }
    }

    // Fallback: Generate PDF with basic info if full report not available
    generateAuditPDF(
      {
        stars: report.stars,
        summary: report.summary || 'No summary available',
        vulnerabilities: { critical: [], high: [], medium: [], low: [] },
        recommendations: [],
        gasOptimizations: [],
      },
      undefined,
      report.transactionHash !== '0x' ? report.transactionHash : null
    );
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 h-full w-full theme-grid-overlay"></div>
      <div className="absolute inset-0 h-full w-full theme-grid-fade"></div>
      
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
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-900/50">
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">CONTRACT HASH</th>
                  <th className="py-4 px-6 text-left text-sm font-mono text-blue-400">TX HASH</th>
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
                    <td className="py-4 px-6 font-mono text-white">
                      <div className="flex items-center gap-2">
                        {report.transactionHash && report.transactionHash !== '0x' ? (
                          <>
                            <span className="text-blue-400">
                              {`${report.transactionHash.slice(0, 10)}...${report.transactionHash.slice(-8)}`}
                            </span>
                            <a
                              href={`${SUPPORTED_CHAINS[report.chain].explorerUrl}/tx/${report.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors duration-200"
                              title="View on Explorer"
                            >
                              <ArrowSquareOut size={14} weight="bold" className="text-blue-400" />
                            </a>
                          </>
                        ) : (
                          <span className="text-gray-500">Pending...</span>
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
                        {report.reportCID ? (
                          <button
                            onClick={() => window.location.href = `/report/${report.reportCID}`}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors duration-200 text-blue-400 text-xs font-medium flex items-center gap-1.5"
                            title="View Full Report"
                          >
                            <FileText size={14} weight="bold" />
                            View Report
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 bg-gray-500/5 border border-gray-500/20 rounded-lg text-gray-500 text-xs">
                            No Report
                          </span>
                        )}
                        <button
                          onClick={() => exportReport(report)}
                          className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                          title="Export PDF"
                        >
                          <Download size={18} className="text-blue-400" weight="bold" />
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
      </div>
    </div>
  );
}
