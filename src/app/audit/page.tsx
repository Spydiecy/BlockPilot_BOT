'use client';

import { useState, useEffect, useCallback } from 'react';

import { z } from "zod";
import { ethers } from 'ethers';
import { 
  Robot,
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI, ChainKey, Audit } from '@/utils/contracts';
import { getDefaultChain } from '@/config/wallet';
import { AuditPageContainer } from '@/components/audit/AuditPageContainer';
import { CodeInputPanel } from '@/components/audit/CodeInputPanel';
import { ResultsPanel } from '@/components/audit/ResultsPanel';
import { uploadAuditReportToIPFS, generatePlaceholderJobId, unpinIPFSReport } from '@/utils/ipfsStorage';

// Define the vulnerability analysis schema
const VulnerabilitySchema = z.object({
  stars: z.number().min(0).max(5),
  summary: z.string(),
  vulnerabilities: z.object({
    critical: z.array(z.string()).default([]),
    high: z.array(z.string()).default([]),
    medium: z.array(z.string()).default([]),
    low: z.array(z.string()).default([])
  }),
  recommendations: z.array(z.string()),
  gasOptimizations: z.array(z.string())
});

// Interface definitions
// Note: These interfaces are defined in ResultsPanel.tsx now, but we need them here for state typing.
// In a larger app, these would be in a shared types file.
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
  // New fields for IPFS integration
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  reportCID?: string;    // IPFS CID
  analysisJobId?: string;
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

// Constants
const COOLDOWN_TIME = 30;

const CHAIN_ID_TO_KEY: { [key: number]: ChainKey } = {
  [getDefaultChain().id]: 'botTestnet',
};

export default function AuditPage() {
  const { chainId, isConnected, provider, signer, currentChain } = useWallet();
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isReviewBlurred, setIsReviewBlurred] = useState(true);
  const [txState, setTxState] = useState<TransactionState>({ isProcessing: false, hash: null, error: null });

  const defaultChain = getDefaultChain();
  // Consider correct network if:
  // 1. chainId from context matches, OR
  // 2. currentChain is set and matches (context populated via different path), OR
  // 3. chainId is null (context not yet hydrated) AND we're connected — give benefit of the doubt
  const isCorrectNetwork = 
    chainId === defaultChain.id || 
    currentChain?.id === defaultChain.id;

  const PENDING_CID_KEY = 'blockpilot_pending_cid';

  // On mount: check if a previous session left an unregistered CID (from refresh/crash)
  // If yes, unpin it immediately — it was never anchored on-chain
  useEffect(() => {
    const orphanedCid = sessionStorage.getItem(PENDING_CID_KEY);
    if (orphanedCid) {
      sessionStorage.removeItem(PENDING_CID_KEY);
      console.log('Found orphaned IPFS report from previous session, cleaning up:', orphanedCid);
      unpinIPFSReport(orphanedCid);
    }
  }, []);

  // Whenever we have an unregistered CID in state, persist it to sessionStorage
  // so refresh/crash can clean it up on next load
  useEffect(() => {
    if (result?.reportCID && !txState.hash) {
      // Report uploaded but not yet registered — save CID so we can clean up on reload
      sessionStorage.setItem(PENDING_CID_KEY, result.reportCID);
    } else {
      // Either registered (txHash exists) or no report — clear the pending key
      sessionStorage.removeItem(PENDING_CID_KEY);
    }
  }, [result?.reportCID, txState.hash]);

  // Also fire on tab close/navigate away (best-effort with sendBeacon)
  useEffect(() => {
    const handleUnload = () => {
      if (result?.reportCID && !txState.hash) {
        navigator.sendBeacon('/api/ipfs/unpin', JSON.stringify({ cid: result.reportCID }));
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [result?.reportCID, txState.hash]);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Validation functions
  const handleCodeChange = useCallback((nextCode: string) => {
    setCode(nextCode);
  }, []);

  const isSolidityCode = useCallback((sourceCode: string): boolean => {
    const pragmaRegex = /pragma\s+solidity\s*\^?[0-9]+\.[0-9]+\.[0-9]+;?/;
    const contractRegex = /contract\s+[A-Za-z_][A-Za-z0-9_]*\s*\{/;
    const importRegex = /import\s+['"].*['"];/;
    return pragmaRegex.test(sourceCode) || contractRegex.test(sourceCode) || importRegex.test(sourceCode);
  }, []);

  // Chain registration function
  const registerAuditOnChain = useCallback(async () => {
    if (!result || !code || !provider || !signer || !chainId) return;

    setTxState({ isProcessing: true, hash: null, error: null });

    try {
      // Calculate contract hash
      const contractHash = ethers.keccak256(
        ethers.toUtf8Bytes(code)
      );

      const contractAddressKey = CHAIN_ID_TO_KEY[chainId];
      if (!contractAddressKey) {
        throw new Error('Unsupported network');
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES[contractAddressKey],
        AUDIT_REGISTRY_ABI,
        signer
      );

      // BOT Chain network fee data
      const feeData = await provider.getFeeData();
      const minPriorityFee = ethers.parseUnits('25', 'gwei');
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
        ? feeData.maxPriorityFeePerGas
        : minPriorityFee;
      const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > minPriorityFee
        ? feeData.maxFeePerGas
        : minPriorityFee * BigInt(2);

      // Format IPFS CID and analysis job ID as bytes32
      const reportCID = result.reportCID || '';
      
      // Ensure analysisJobId is bytes32
      let analysisJobIdBytes32 = result.analysisJobId || '0x' + '0'.repeat(64);
      if (analysisJobIdBytes32.length < 66) {
        analysisJobIdBytes32 = analysisJobIdBytes32 + '0'.repeat(66 - analysisJobIdBytes32.length);
      }

      // Prepare summary preview (max 100 chars)
      const summaryPreview = result.summary.substring(0, 100);

      // Call registerAudit with IPFS CID
      const tx = await contract.registerAudit(
        contractHash,
        result.stars,
        result.criticalCount || 0,
        result.highCount || 0,
        result.mediumCount || 0,
        reportCID,
        summaryPreview,
        analysisJobIdBytes32,
        { maxPriorityFeePerGas, maxFeePerGas }
      );

      const receipt = await tx.wait();
      setTxState({ isProcessing: false, hash: receipt.hash, error: null });
      setIsReviewBlurred(false);
      // Successfully registered — clear the pending CID from sessionStorage
      sessionStorage.removeItem('blockpilot_pending_cid');
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.reason || err.message || 'An unknown error occurred.';
      setTxState({ isProcessing: false, hash: null, error: errorMessage });

      // On-chain registration failed — clean up the IPFS file
      // so we don't leave orphaned reports that were never anchored
      if (result?.reportCID) {
        console.log('Cleaning up orphaned IPFS report:', result.reportCID);
        unpinIPFSReport(result.reportCID);
        // Clear the CID from result state so user can re-run
        setResult(prev => prev ? { ...prev, reportCID: '' } : prev);
      }
    }
  }, [chainId, code, provider, result, signer]);

  // Main analysis function
  const analyzeContract = useCallback(async () => {
    if (!code.trim()) {
      console.error('Please enter your smart contract code.');
      setTxState({ isProcessing: false, hash: null, error: 'Please enter your smart contract code.' });
      return;
    }

    if (!isSolidityCode(code)) {
      setTxState({ isProcessing: false, hash: null, error: 'Invalid input. Please ensure your code is a valid Solidity smart contract.' });
      return;
    }

    setIsAnalyzing(true);
    setIsReviewBlurred(true);

    try {
      // Call our backend API endpoint for AI analysis
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode: code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Analysis failed');
      }

      const result = await response.json();
      
      // Extract analysis from backend response
      const validatedResponse = VulnerabilitySchema.parse(result.analysis);

      // Enforce strict rating based on vulnerabilities
      if (validatedResponse.vulnerabilities.critical.length > 0) {
        validatedResponse.stars = Math.min(validatedResponse.stars, 2);
      }
      if (validatedResponse.vulnerabilities.high.length > 0) {
        validatedResponse.stars = Math.min(validatedResponse.stars, 3);
      }
      if (validatedResponse.vulnerabilities.critical.length > 2) {
        validatedResponse.stars = 0;
      }

      // Get counts for new contract structure
      const criticalCount = validatedResponse.vulnerabilities.critical.length;
      const highCount = validatedResponse.vulnerabilities.high.length;
      const mediumCount = validatedResponse.vulnerabilities.medium.length;

      // Use job ID from backend or generate one for analysis tracking
      const computeJobId = result.jobId || generatePlaceholderJobId();

      // Prepare report JSON for IPFS
      const reportJson = JSON.stringify({
        analysis: validatedResponse,
        contractCode: code,
        timestamp: new Date().toISOString(),
        computeJobId,
        provider: result.provider || 'Mistral AI',
        model: result.model || 'mistral-large-latest',
      });

      // Upload to IPFS and get CID
      let reportCID = '';
      try {
        reportCID = await uploadAuditReportToIPFS(reportJson);
      } catch (storageError) {
        console.warn('IPFS upload failed, using placeholder:', storageError);
        reportCID = '';
      }

      // Add metadata to result
      const enrichedResult: AuditResult = {
        ...validatedResponse,
        criticalCount: criticalCount,
        highCount: highCount,
        mediumCount: mediumCount,
        reportCID: reportCID,
        analysisJobId: computeJobId
      };

      setResult(enrichedResult);
      setShowResult(true);
      setCooldown(COOLDOWN_TIME);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      
      // Handle specific API errors with user-friendly messages
      let errorMessage = 'Analysis failed. Please try again.';
      if (error?.message?.includes('Mistral API key not configured')) {
        errorMessage = 'AI service not configured. Please contact administrator.';
      } else if (error?.message?.includes('Invalid Mistral API key')) {
        errorMessage = 'AI service authentication failed. Please contact administrator.';
      } else if (error?.message?.includes('service_tier_capacity_exceeded') || error?.message?.includes('429')) {
        errorMessage = 'AI service is currently at capacity. Please try again in a few moments.';
      } else if (error?.message?.includes('rate_limit')) {
        errorMessage = 'Rate limit reached. Please wait a moment before trying again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setTxState({ isProcessing: false, hash: null, error: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, isSolidityCode]);

  return (
    <AuditPageContainer>
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
            <Robot size={24} className="text-blue-400" weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tighter">AI Smart Contract Audit</h1>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-150px)]">
        <CodeInputPanel 
          code={code}
          setCode={handleCodeChange}
          analyzeContract={analyzeContract}
          isAnalyzing={isAnalyzing}
          cooldown={cooldown}
        />
        <ResultsPanel 
          isAnalyzing={isAnalyzing}
          result={result}
          showResult={showResult}
          txState={txState}
          isReviewBlurred={isReviewBlurred}
          registerAuditOnChain={registerAuditOnChain}
          isCorrectNetwork={isCorrectNetwork}
          isConnected={isConnected}
          defaultChain={defaultChain}
        />
      </div>
    </AuditPageContainer>
  );
}
