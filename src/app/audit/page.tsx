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
import { uploadAuditReportTo0GStorage } from '@/utils/zeroGStorage';
import { generatePlaceholderJobId } from '@/utils/zeroGCompute';

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
  // New fields for 0G integration
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  reportHash?: string; // 0G Storage hash
  computeJobId?: string; // 0G Compute job ID
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

// Constants
const COOLDOWN_TIME = 30;

const CHAIN_ID_TO_KEY: { [key: number]: ChainKey } = {
  [getDefaultChain().id]: 'zeroGTestnet',
};

export default function AuditPage() {
  const { chainId, isConnected, provider, signer } = useWallet();
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isReviewBlurred, setIsReviewBlurred] = useState(true);
  const [txState, setTxState] = useState<TransactionState>({ isProcessing: false, hash: null, error: null });

  const defaultChain = getDefaultChain();
  const isCorrectNetwork = chainId === defaultChain.id;

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

      // 0G network fee data
      const feeData = await provider.getFeeData();
      const minPriorityFee = ethers.parseUnits('25', 'gwei');
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
        ? feeData.maxPriorityFeePerGas
        : minPriorityFee;
      const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > minPriorityFee
        ? feeData.maxFeePerGas
        : minPriorityFee * BigInt(2);

      // Format 0G Storage hash and Compute job ID as bytes32
      const reportHashBytes32 = result.reportHash || '0x' + '0'.repeat(64);
      
      // Ensure computeJobId is properly formatted as bytes32 (32 bytes = 64 hex chars)
      let computeJobIdBytes32 = result.computeJobId || '0x' + '0'.repeat(64);
      if (computeJobIdBytes32.length < 66) { // 0x + 64 chars = 66 total
        // Pad to 64 hex characters if needed
        computeJobIdBytes32 = computeJobIdBytes32 + '0'.repeat(66 - computeJobIdBytes32.length);
      }

      // Prepare summary preview (max 100 chars)
      const summaryPreview = result.summary.substring(0, 100);

      // Call registerAudit with all required parameters
      const tx = await contract.registerAudit(
        contractHash,
        result.stars,
        result.criticalCount || 0,
        result.highCount || 0,
        result.mediumCount || 0,
        reportHashBytes32,
        summaryPreview,
        computeJobIdBytes32,
        { maxPriorityFeePerGas, maxFeePerGas }
      );

      const receipt = await tx.wait();
      setTxState({ isProcessing: false, hash: receipt.transactionHash, error: null });
      setIsReviewBlurred(false); // Unblur the review after successful registration
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.reason || err.message || 'An unknown error occurred.';
      setTxState({ isProcessing: false, hash: null, error: errorMessage });
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

      // Use job ID from backend or generate placeholder
      const computeJobId = result.jobId || generatePlaceholderJobId();

      // Prepare report JSON for 0G Storage
      const reportJson = JSON.stringify({
        analysis: validatedResponse,
        contractCode: code,
        timestamp: new Date().toISOString(),
        computeJobId,
        provider: result.provider || 'Mistral AI',
        model: result.model || 'mistral-large-latest',
      });

      // Upload to 0G Storage and get hash
      let reportHash = '0x0'; // Fallback
      try {
        reportHash = await uploadAuditReportTo0GStorage(reportJson);
      } catch (storageError) {
        console.warn('0G Storage upload failed, using placeholder:', storageError);
        // Use placeholder hash if upload fails
        reportHash = ethers.keccak256(ethers.toUtf8Bytes(reportJson));
      }

      // Add 0G metadata to result
      const enrichedResult: AuditResult = {
        ...validatedResponse,
        criticalCount: criticalCount,
        highCount: highCount,
        mediumCount: mediumCount,
        reportHash: reportHash,
        computeJobId: computeJobId
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
