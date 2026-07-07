'use client';

import { SupportedChain } from '@/config/wallet';
import { AnalyzingState } from './AnalyzingState';
import { InitialState } from './InitialState';
import { ReportDisplay } from './ReportDisplay';

// These types should be co-located or imported from a shared types file
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

interface ResultsPanelProps {
  isAnalyzing: boolean;
  result: AuditResult | null;
  showResult: boolean;
  txState: TransactionState;
  isReviewBlurred: boolean;
  registerAuditOnChain: () => void;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  defaultChain: SupportedChain;
}

export function ResultsPanel({ 
  isAnalyzing, 
  result, 
  showResult, 
  txState, 
  isReviewBlurred, 
  registerAuditOnChain, 
  isCorrectNetwork, 
  isConnected, 
  defaultChain 
}: ResultsPanelProps) {
  if (isAnalyzing) {
    return <AnalyzingState />;
  }

  if (result && showResult) {
    return (
      <ReportDisplay 
        result={result}
        txState={txState}
        isReviewBlurred={isReviewBlurred}
        registerAuditOnChain={registerAuditOnChain}
        isCorrectNetwork={isCorrectNetwork}
        isConnected={isConnected}
        defaultChain={defaultChain}
      />
    );
  }

  return <InitialState />;
}