'use client';

import { useState, useEffect } from 'react';

import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { ethers } from 'ethers';
import { 
  Robot,
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI, ChainKey } from '@/utils/contracts';
import { getDefaultChain } from '@/config/wallet';
import { AuditPageContainer } from '@/components/audit/AuditPageContainer';
import { CodeInputPanel } from '@/components/audit/CodeInputPanel';
import { ResultsPanel } from '@/components/audit/ResultsPanel';

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

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
}

interface TransactionState {
  isProcessing: boolean;
  hash: string | null;
  error: string | null;
}

// Constants
const COOLDOWN_TIME = 30;

const CHAIN_ID_TO_KEY: { [key: number]: ChainKey } = {
  [getDefaultChain().id]: 'blockdagTestnet',
};

export default function AuditPage() {
  const { chainId, isConnected, provider, signer, connect: connectWallet } = useWallet();
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
  const isSolidityCode = (code: string): boolean => {
    const pragmaRegex = /pragma\s+solidity\s*\^?[0-9]+\.[0-9]+\.[0-9]+;?/;
    const contractRegex = /contract\s+[A-Za-z_][A-Za-z0-9_]*\s*\{/;
    const importRegex = /import\s+['"].*['"];/;
    return pragmaRegex.test(code) || contractRegex.test(code) || importRegex.test(code);
  };



  // Chain registration function
  const registerAuditOnChain = async () => {
    if (!result || !code) return;

    setTxState({ isProcessing: true, hash: null, error: null });

    if (!provider || !signer || !chainId) return;

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

      const tx = await contract.registerAudit(
        contractHash,
        result.stars,
        `https://ipfs.io/ipfs/YOUR_IPFS_HASH` // Placeholder for IPFS hash
      );

      const receipt = await tx.wait();
      setTxState({ isProcessing: false, hash: receipt.transactionHash, error: null });
      setIsReviewBlurred(false); // Unblur the review after successful registration
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.reason || err.message || 'An unknown error occurred.';
      setTxState({ isProcessing: false, hash: null, error: errorMessage });
    }
  };

  // Main analysis function
  const analyzeContract = async () => {
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
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `You are a professional smart contract security auditor. Analyze the provided Solidity smart contract with zero tolerance for security issues.
            
            Rating System (Extremely Strict):
            - 5 stars: ONLY if contract has zero vulnerabilities and follows all best practices
            - 4 stars: ONLY if no critical/high vulnerabilities, max 1-2 medium issues
            - 3 stars: No critical but has high severity issues needing attention
            - 2 stars: Has critical vulnerability or multiple high severity issues
            - 1 star: Multiple critical and high severity vulnerabilities
            - 0 stars: Fundamental security flaws making contract unsafe
            
            Critical Issues (Any reduces rating to 2 or lower):
            - Reentrancy vulnerabilities
            - Unchecked external calls
            - Integer overflow/underflow risks
            - Access control flaws
            - Unprotected selfdestruct
            - Missing input validation

            Return response in the following JSON format:
            {
              "stars": number,
              "summary": "string",
              "vulnerabilities": {
                "critical": ["string"],
                "high": ["string"],
                "medium": ["string"],
                "low": ["string"]
              },
              "recommendations": ["string"],
              "gasOptimizations": ["string"]
            }`
          },
          {
            role: "user",
            content: code
          }
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        maxTokens: 2048
      });

      const responseText = response.choices?.[0]?.message?.content;
      if (typeof responseText !== 'string') {
        throw new Error('Invalid response format');
      }
      const parsedResponse = JSON.parse(responseText);
      
      // Validate response against schema
      const validatedResponse = VulnerabilitySchema.parse(parsedResponse);

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

      setResult(validatedResponse);
      setShowResult(true);
      setCooldown(COOLDOWN_TIME);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      // The error state was unused, directly log or use txState for user feedback
      setTxState({ isProcessing: false, hash: null, error: 'Analysis failed. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };



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
          setCode={setCode}
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