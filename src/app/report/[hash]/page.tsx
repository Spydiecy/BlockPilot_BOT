'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Copy,
  CheckCircle,
  Download,
  ArrowSquareOut,
  CircleNotch,
  ShieldCheck,
  Warning,
  Info,
} from 'phosphor-react';
import { generateAuditPDF } from '@/utils/generatePDF';
import { SUPPORTED_CHAINS } from '@/config/wallet';

interface ReportData {
  analysis: {
    stars: number;
    summary: string;
    vulnerabilities: {
      critical: string[];
      high: string[];
      medium: string[];
      low: string[];
    };
    recommendations: string[];
    gasOptimizations: string[];
  };
  contractCode?: string;
  timestamp: string;
  computeJobId?: string;
  provider: string;
  model: string;
}

interface AuditInfo {
  contractHash: string;
  reportHash: string;
  auditor: string;
  timestamp: number;
  stars: number;
  chain: string;
  transactionHash?: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportHash = params.hash as string;

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [auditInfo, setAuditInfo] = useState<AuditInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [reportHash]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch report from 0G Storage
      const response = await fetch('/api/0g-storage/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportHash }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReportData(data.report);

      // Try to fetch audit info from blockchain
      // This is optional - report can be viewed without it
      try {
        const auditResponse = await fetch('/api/blockchain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'getAllAudits',
            params: [{ startIndex: 0, limit: 100 }],
          }),
        });

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          const audit = auditData.result.find((a: any) => a.reportHash === reportHash);
          if (audit) {
            setAuditInfo(audit);
          }
        }
      } catch (err) {
        console.warn('Could not fetch audit info:', err);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadReport = () => {
    if (!reportData) return;

    // Use the same PDF generation as the audit page
    generateAuditPDF(
      reportData.analysis,
      reportData.contractCode,
      auditInfo?.transactionHash || null
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/10';
      case 'high':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <Warning size={20} weight="fill" className="text-red-400" />;
      case 'medium':
        return <Info size={20} weight="fill" className="text-yellow-400" />;
      case 'low':
        return <Info size={20} weight="fill" className="text-blue-400" />;
      default:
        return <ShieldCheck size={20} weight="fill" className="text-green-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <CircleNotch className="animate-spin mx-auto mb-4" size={48} weight="bold" />
          <p className="text-blue-400">Loading report from 0G Storage...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Warning className="mx-auto mb-4 text-red-400" size={48} weight="fill" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Report</h2>
          <p className="text-gray-400 mb-4">{error || 'Report not found'}</p>
          <button
            onClick={() => router.push('/reports')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 h-full w-full theme-grid-overlay"></div>
      <div className="absolute inset-0 h-full w-full theme-grid-fade"></div>

      {/* Back Button - Outside main container for top-left positioning */}
      <div className="relative z-10 pt-6 pl-6">
        <button
          onClick={() => router.push('/reports')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={20} weight="bold" />
          Back to Reports
        </button>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                <FileText size={28} className="text-blue-400" weight="fill" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tighter">
                  Security Audit Report
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Stored on 0G Storage Network
                </p>
              </div>
            </div>

            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-full transition-colors"
            >
              <Download size={20} weight="bold" />
              Export Report
            </button>
          </div>
        </div>

        {/* Report Hash Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 border border-blue-900/50 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-blue-400">0G Storage Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Report Hash (0G Storage Root Hash)</label>
              <div className="flex items-center gap-2 bg-black/50 border border-blue-900/40 rounded-xl p-3">
                <code className="text-sm text-white flex-1 truncate">{reportHash}</code>
                <button
                  onClick={() => copyToClipboard(reportHash, 'reportHash')}
                  className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Copy hash"
                >
                  {copiedField === 'reportHash' ? (
                    <CheckCircle size={18} weight="fill" className="text-green-400" />
                  ) : (
                    <Copy size={18} weight="bold" className="text-blue-400" />
                  )}
                </button>
              </div>
            </div>

            {auditInfo && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Contract Hash</label>
                  <div className="flex items-center gap-2 bg-black/50 border border-blue-900/40 rounded-xl p-3">
                    <code className="text-sm text-white flex-1 truncate">
                      {auditInfo.contractHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(auditInfo.contractHash, 'contractHash')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      {copiedField === 'contractHash' ? (
                        <CheckCircle size={18} weight="fill" className="text-green-400" />
                      ) : (
                        <Copy size={18} weight="bold" className="text-blue-400" />
                      )}
                    </button>
                  </div>
                </div>

                {auditInfo.transactionHash && auditInfo.transactionHash !== '0x' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Transaction Hash</label>
                    <div className="flex items-center gap-2 bg-black/50 border border-blue-900/40 rounded-xl p-3">
                      <code className="text-sm text-white flex-1 truncate">
                        {auditInfo.transactionHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(auditInfo.transactionHash!, 'txHash')}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Copy transaction hash"
                      >
                        {copiedField === 'txHash' ? (
                          <CheckCircle size={18} weight="fill" className="text-green-400" />
                        ) : (
                          <Copy size={18} weight="bold" className="text-blue-400" />
                        )}
                      </button>
                      <a
                        href={`https://chainscan-galileo.0g.ai/tx/${auditInfo.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="View on Explorer"
                      >
                        <ArrowSquareOut size={18} weight="bold" className="text-blue-400" />
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Auditor</label>
                  <div className="flex items-center gap-2 bg-black/50 border border-blue-900/40 rounded-xl p-3">
                    <code className="text-sm text-white flex-1 truncate">
                      {auditInfo.auditor}
                    </code>
                    <a
                      href={`https://chainscan-galileo.0g.ai/address/${auditInfo.auditor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="View auditor profile"
                    >
                      <ArrowSquareOut size={18} weight="bold" className="text-blue-400" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Provider</label>
              <div className="bg-black/50 border border-blue-900/40 rounded-xl p-3">
                <p className="text-sm text-white">{reportData.provider}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Model</label>
              <div className="bg-black/50 border border-blue-900/40 rounded-xl p-3">
                <p className="text-sm text-white">{reportData.model}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Analyzed</label>
              <div className="bg-black/50 border border-blue-900/40 rounded-xl p-3">
                <p className="text-sm text-white">
                  {new Date(reportData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/50 border border-blue-900/50 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Security Rating</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-blue-400">
              {reportData.analysis.stars}/5
            </div>
            <div className="flex-1">
              <p className="text-gray-300 mb-2">{reportData.analysis.summary}</p>
              <div className="flex gap-2">
                {reportData.analysis.vulnerabilities.critical.length > 0 && (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-400">
                    {reportData.analysis.vulnerabilities.critical.length} Critical
                  </span>
                )}
                {reportData.analysis.vulnerabilities.high.length > 0 && (
                  <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-xs text-orange-400">
                    {reportData.analysis.vulnerabilities.high.length} High
                  </span>
                )}
                {reportData.analysis.vulnerabilities.medium.length > 0 && (
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                    {reportData.analysis.vulnerabilities.medium.length} Medium
                  </span>
                )}
                {reportData.analysis.vulnerabilities.low.length > 0 && (
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                    {reportData.analysis.vulnerabilities.low.length} Low
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vulnerabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 border border-blue-900/50 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Vulnerabilities</h2>
          <div className="space-y-4">
            {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
              const vulns = reportData.analysis.vulnerabilities[severity];
              if (vulns.length === 0) return null;

              return (
                <div key={severity} className={`border rounded-xl p-4 ${getSeverityColor(severity)}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {getSeverityIcon(severity)}
                    <h3 className="font-semibold capitalize text-white">
                      {severity} ({vulns.length})
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {vulns.map((vuln, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{vuln}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recommendations */}
        {reportData.analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/50 border border-green-900/50 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Recommendations</h2>
            <ul className="space-y-3">
              {reportData.analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-300">
                  <CheckCircle size={20} weight="fill" className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Gas Optimizations */}
        {reportData.analysis.gasOptimizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/50 border border-purple-900/50 rounded-2xl p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Gas Optimizations</h2>
            <ul className="space-y-3">
              {reportData.analysis.gasOptimizations.map((opt, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-300">
                  <span className="text-purple-400 font-bold flex-shrink-0">⚡</span>
                  <span>{opt}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
