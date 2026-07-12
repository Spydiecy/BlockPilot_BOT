// ContractBuilder.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { ethers } from 'ethers';
import {
  FileCode,
  Robot,
  CircleNotch,
  Copy,
  Check,
  Rocket,
  Link,
  Code,
  Lightning,
  Shield,
  ArrowRight
} from 'phosphor-react';
import { CONTRACT_TEMPLATES, ContractTemplate } from './templates';
import { connectWallet, CHAIN_CONFIG } from '@/utils/web3';
import React from 'react';

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

// Define response schema
const ContractSchema = z.object({
  code: z.string(),
  features: z.array(z.string()),
  securityNotes: z.array(z.string())
});

export default function ContractBuilder() {
  // Template and code generation state
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customFeatures, setCustomFeatures] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractParams, setContractParams] = useState<Record<string, string>>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<keyof typeof CHAIN_CONFIG | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [securityNotes, setSecurityNotes] = useState<string[]>([]);

  // State for manual code input in generated code
  const [manualCode, setManualCode] = useState('');

  // Use manualCode if generatedCode is empty, otherwise use generatedCode
  const displayedCode = generatedCode || manualCode;

  // Function to handle changes in manual code input
  const handleManualCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualCode(e.target.value);
    // Clear generatedCode when manually typing
    setGeneratedCode('');
  };

  // Detect current network
  const detectCurrentNetwork = async () => {
    try {
      if (!window.ethereum) return null;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      
      // Check which network we're on
      for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
        if (chainId.toLowerCase() === config.chainId.toLowerCase()) {
          setCurrentChain(key as keyof typeof CHAIN_CONFIG);
          return key as keyof typeof CHAIN_CONFIG;
        }
      }
      
      setCurrentChain(null);
      return null;
    } catch (error) {
      console.error('Error detecting network:', error);
      setCurrentChain(null);
      return null;
    }
  };

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          
          if (accounts && accounts.length > 0) {
            setWalletConnected(true);
            await detectCurrentNetwork();
          }
        } catch (error) {
          console.error('Error checking wallet:', error);
        }
      }
    };

    checkWallet();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletConnected(false);
          setCurrentChain(null);
        } else {
          setWalletConnected(true);
          await detectCurrentNetwork();
        }
      };

      const handleChainChanged = async () => {
        await detectCurrentNetwork();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Update contract parameters when template changes
  useEffect(() => {
    if (selectedTemplate?.defaultParams) {
      setContractParams(selectedTemplate.defaultParams);
      setGeneratedCode(selectedTemplate.baseCode);
    } else {
      setContractParams({});
      setGeneratedCode('');
    }
  }, [selectedTemplate]);

  // Track mouse position for gradient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate contract code using Mistral AI
  const generateContract = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `You are an expert Solidity developer. Generate a secure and optimized smart contract based on these requirements:

        Important Rules:
        1. Use Solidity version 0.8.19
        2. DO NOT use ANY external imports or libraries
        3. Include all necessary functionality directly in the contract
        4. Add proper access control and safety checks
        5. Include events for all state changes
        6. Implement comprehensive security measures
        7. Add gas optimizations
        8. Return response in exact JSON format
        
        Security Considerations:
        - Include reentrancy guards where needed
        - Add proper access control
        - Implement input validation
        - Add checks for integer overflow
        - Validate addresses
        - Include event emissions
        - Handle edge cases`
          },
          {
            role: "user",
            content: `Generate a contract with these specifications:
        Template: ${selectedTemplate.name}
        Base Code: ${selectedTemplate.baseCode || 'Create new contract'}
        Custom Features: ${customFeatures || 'Standard features'}
        Parameters: ${JSON.stringify(contractParams)}
        
        Return in this exact format:
        {
          "code": "complete solidity code",
          "features": ["list of implemented features"],
          "securityNotes": ["list of security measures implemented"]
        }`
          }
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.1,
        maxTokens: 4096
      });

      const responseText = response.choices?.[0]?.message?.content || '';
      const parsedResponse = JSON.parse(typeof responseText === 'string' ? responseText : '');

      // Validate response against schema
      const validatedResponse = ContractSchema.parse(parsedResponse);

      setGeneratedCode(validatedResponse.code);
      setSecurityNotes(validatedResponse.securityNotes);
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate contract. Please try again.');
      if (selectedTemplate.baseCode) {
        setGeneratedCode(selectedTemplate.baseCode);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Deploy the generated contract
  const deployContract = async () => {
    if (!displayedCode || !walletConnected) return;

    setIsDeploying(true);
    setDeploymentError(null);

    try {
      // First establish connection and detect chain
      const { provider, signer } = await connectWallet();
      const detectedChain = await detectCurrentNetwork();
      
      // Validate we're on BlockDAG Testnet
      const network = await provider.getNetwork();
      const currentChainId = '0x' + network.chainId.toString(16);

      if (currentChainId !== CHAIN_CONFIG.blockdagTestnet.chainId) {
        throw new Error('Please switch to BlockDAG Testnet to deploy contracts');
      }

      // Compile contract
      const response = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: displayedCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorDetails = errorData.details || (await response.text());
        throw new Error(`Compilation failed: ${errorDetails}`);
      }

      const { abi, bytecode } = await response.json();

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);

      // Process constructor arguments
      const constructorAbi = abi.find((item: any) => item.type === 'constructor');
      const constructorArgs = Object.values(contractParams).map((value, index) => {
        const input = constructorAbi?.inputs?.[index];

        if (!input) return value;

        switch (input.type) {
          case 'uint256':
            return ethers.parseUnits(value.toString(), 18);
          case 'address':
            if (!ethers.isAddress(value)) {
              throw new Error(`Invalid address for parameter ${input.name}`);
            }
            return value;
          default:
            return value;
        }
      });

      // Deploy contract
      const contract = await contractFactory.deploy(...constructorArgs);
      const receipt = await contract.deploymentTransaction()?.wait();

      if (!receipt?.contractAddress) {
        throw new Error('Failed to get contract address');
      }

      setDeployedAddress(receipt.contractAddress);

    } catch (error: any) {
      console.error('Deployment failed:', error);
      setDeploymentError(error.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  // Helper functions
  const getExplorerUrl = () => {
    if (!currentChain || !deployedAddress) return null;
    const baseUrl = CHAIN_CONFIG[currentChain].blockExplorerUrls[0];
    return `${baseUrl}/address/${deployedAddress}`;
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setWalletConnected(true);
      await detectCurrentNetwork();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div
        className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]"
      ></div>
      <div className="absolute inset-0 h-full w-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
              <Code size={24} className="text-blue-400" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tighter">Smart Contract Builder</h1>
          </div>
        </header>
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-2xl"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        {deployedAddress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Contract deployed successfully!</p>
                <p className="text-sm font-mono">{deployedAddress}</p>
              </div>
              <a
                href={getExplorerUrl() || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <Link size={20} weight="bold" />
                View on Explorer
              </a>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Templates and Parameters */}
          <div className="relative bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col p-4 h-full transition-colors duration-300">
            <div className="flex-1 flex flex-col space-y-4">
              {/* Template Selection */}
              <div className="border-b border-blue-900/50 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Robot className="text-blue-400" size={20} weight="duotone" />
                  <span className="font-mono text-white">Contract Templates</span>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {CONTRACT_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full p-3 rounded-2xl border transition-all duration-200 text-left hover:shadow-md
                        ${selectedTemplate?.name === template.name
                          ? 'border-blue-500 bg-blue-500/20 text-white shadow-blue-500/5'
                          : 'border-blue-900/50 hover:border-blue-500/50 bg-black/20'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-blue-400">
                          {template.icon}
                        </div>
                        <span className="font-semibold text-white text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-blue-400">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              
              {/* Parameters Form */}
              {selectedTemplate && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="text-blue-400" size={20} weight="duotone" />
                    <span className="font-mono text-white">Contract Parameters</span>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(contractParams).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm text-gray-400 mb-1 block">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setContractParams((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full bg-transparent rounded-lg border border-blue-900/50 p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Custom Features
                      </label>
                      <textarea
                        value={customFeatures}
                        onChange={(e) => setCustomFeatures(e.target.value)}
                        placeholder="Describe additional features..."
                        className="w-full h-24 bg-transparent rounded-lg border border-blue-900/50 p-3 text-white resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Generate Button */}
            <div className="pt-4 border-t border-blue-900/50">
              <button
                onClick={generateContract}
                disabled={!selectedTemplate || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:bg-blue-950 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} weight="bold" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Robot size={20} weight="duotone" />
                    Generate Contract
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Generated Code and Deployment */}
          <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col transition-colors duration-300">
            <div className="p-4 border-b border-blue-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCode className="text-blue-400" size={20} weight="duotone" />
                <span className="font-mono text-white">Generated Contract</span>
              </div>
              {displayedCode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(displayedCode)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-500/10"
                  >
                    {copySuccess ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                    {copySuccess ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {displayedCode ? (
                <textarea
                  value={displayedCode}
                  onChange={handleManualCodeChange}
                  className="w-full h-full p-6 font-mono text-sm text-white bg-transparent border-none resize-none outline-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-blue-400 p-8">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                      <Code size={80} className="text-blue-400 relative z-10" weight="duotone" />
                    </div>
                    <h3 className="text-xl font-mono mb-4">Smart Contract Builder</h3>
                    <p className="text-blue-300 mb-6 max-w-md mx-auto">
                      Select a template and configure parameters to generate your smart contract
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        ERC-20 Tokens
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        NFT Collections
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        Custom Logic
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        One-Click Deploy
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deploy Section */}
            {displayedCode && (
              <div className="p-4 border-t border-blue-900/50">
                {!walletConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                  >
                    <Lightning size={20} weight="fill" />
                    Connect Wallet to Deploy
                  </button>
                ) : (
                  <button
                    onClick={deployContract}
                    disabled={isDeploying}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl hover:from-green-700 hover:to-green-800 disabled:bg-gray-800 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                  >
                    {isDeploying ? (
                      <>
                        <CircleNotch className="animate-spin" size={20} weight="bold" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket size={20} weight="fill" />
                        Deploy to BlockDAG Testnet
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}