'use client';

import { Star, CheckCircle, Lightning, Lock, CircleNotch, ArrowSquareOut, Warning } from 'phosphor-react';
import { SupportedChain } from '@/config/wallet';

// Shared types - ideally in a dedicated types file
interface AuditResult {
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
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

interface SeverityConfig {
  color: string;
  label: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const SEVERITY_CONFIGS: Record<string, SeverityConfig> = {
  critical: { 
    color: 'text-red-500', 
    label: 'Critical', 
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: <Warning className="text-red-500" size={20} weight="fill" />
  },
  high: { 
    color: 'text-orange-500', 
    label: 'High Risk',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    icon: <Warning className="text-orange-500" size={20} weight="fill" />
  },
  medium: { 
    color: 'text-yellow-500', 
    label: 'Medium Risk',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: <Warning className="text-yellow-500" size={20} weight="fill" />
  },
  low: { 
    color: 'text-blue-500', 
    label: 'Low Risk',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: <Warning className="text-blue-500" size={20} weight="bold" />
  }
};

interface ReportDisplayProps {
  result: AuditResult;
  txState: TransactionState;
  isReviewBlurred: boolean;
  registerAuditOnChain: () => void;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  defaultChain: SupportedChain;
}

export function ReportDisplay({ 
  result, 
  txState, 
  isReviewBlurred, 
  registerAuditOnChain, 
  isCorrectNetwork, 
  isConnected, 
  defaultChain 
}: ReportDisplayProps) {
  return (
    <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 p-6 overflow-y-auto custom-scrollbar relative">
      {txState.hash && (
        <a 
          href={`${defaultChain.explorerUrl}/tx/${txState.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 hover:bg-green-500/20 transition-colors"
        >
          <ArrowSquareOut size={14} />
          View Transaction
        </a>
      )}
      <div className={`transition-all duration-500 ${isReviewBlurred ? 'blur-sm' : ''}`}>
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={32} 
                weight="fill"
                className={i < result.stars ? 'text-yellow-400' : 'text-gray-600'}
              />
            ))}
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tighter">Audit Complete</h2>
          <p className="text-gray-400 mt-2">{result.summary}</p>
        </div>
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Vulnerabilities Detected</h3>
          {Object.entries(result.vulnerabilities).map(([severity, issues]) => (
            issues.length > 0 && (
              <div key={severity} className={`p-4 rounded-2xl ${SEVERITY_CONFIGS[severity].bgColor} border ${SEVERITY_CONFIGS[severity].borderColor}`}>
                <div className="flex items-center gap-3 mb-2">
                  {SEVERITY_CONFIGS[severity].icon}
                  <h4 className={`text-md font-bold ${SEVERITY_CONFIGS[severity].color}`}>{SEVERITY_CONFIGS[severity].label}</h4>
                </div>
                <ul className="list-disc list-inside text-white text-sm space-y-1">
                  {issues.map((issue, index) => <li key={index}>{issue}</li>)}
                </ul>
              </div>
            )
          ))}
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
            <CheckCircle size={20} weight="fill" className="text-green-400" />
            Recommendations
          </h3>
          <ul className="list-disc list-inside text-white text-sm space-y-2 mt-3">
            {result.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2 flex items-center gap-2">
            <Lightning size={20} weight="fill" className="text-purple-400" />
            Gas Optimizations
          </h3>
          <ul className="list-disc list-inside text-white text-sm space-y-2 mt-3">
            {result.gasOptimizations.map((opt, index) => <li key={index}>{opt}</li>)}
          </ul>
        </div>
      </div>

      {isReviewBlurred && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">Unlock Full Report</h3>
          <p className="text-gray-400 mb-6 max-w-sm">
            Register this audit on the Lisk Sepolia Testnet to permanently store the results and receive a verifiable proof-of-audit.
          </p>
          <div className="w-full max-w-xs">
            <button 
              onClick={registerAuditOnChain}
              disabled={txState.isProcessing || !isConnected}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              {txState.isProcessing ? (
                <>
                  <CircleNotch size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={20} weight="fill" />
                  Register Audit On-Chain
                </>
              )}
            </button>
            
            {!isCorrectNetwork && isConnected && (
              <div className="mt-4 text-yellow-400 text-sm">
                Please switch to Lisk Sepolia Testnet to register.
              </div>
            )}
          </div>
        </div>
      )}

      {txState.error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-2xl">
          {txState.error}
        </div>
      )}
    </div>
  );
}
