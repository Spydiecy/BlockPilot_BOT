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
  
  // Audit toggle state
  const [auditOnDeploy, setAuditOnDeploy] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);

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
        model: "open-mistral-7b",
        messages: [
          {
            role: "system",
            content: `You are an expert Solidity developer who creates ONLY high-quality, production-ready smart contracts that compile without errors.

        CRITICAL QUALITY REQUIREMENTS:
        - Generate contracts that would score 4-5 stars in security audits
        - MUST compile without ANY errors in Solidity 0.8.19
        - Use ONLY valid Solidity syntax and features
        - NO experimental or unsupported features
        - Include comprehensive security measures and best practices
        - Implement proper access control, reentrancy guards, and input validation
        - Add detailed NatSpec comments for all functions
        - Use gas-efficient patterns
        - Follow OpenZeppelin standards where applicable

        SOLIDITY SYNTAX RULES (CRITICAL):
        1. Use Solidity version 0.8.19 ONLY
        2. DO NOT use string concatenation with + operator (not supported in Solidity)
        3. DO NOT use string.isNotEmpty() or any non-existent string methods
        4. DO NOT cast uint256 to string (not allowed in Solidity)
        5. Use bytes32 for hashes, NOT string
        6. Use simple string literals in require statements: require(condition, "Error message");
        7. For dynamic error messages, use custom errors or separate require statements
        8. DO NOT use ANY external imports or libraries - write everything inline
        9. Use mapping(address => uint256) for balances, NOT balanceOf mapping
        10. Implement standard ERC20/ERC721 interfaces correctly
        11. Use proper visibility modifiers: public, private, internal, external
        12. Use proper state mutability: view, pure, payable where appropriate
        13. NO placeholders like "...", "{ ... }", or incomplete code
        14. Every function MUST have a complete implementation

        VALID SOLIDITY PATTERNS:
        ✅ require(condition, "Simple error message");
        ✅ if (condition) revert("Error message");
        ✅ error CustomError(string message); then revert CustomError("message");
        ✅ mapping(address => uint256) private balances;
        ✅ uint256 public totalSupply;
        ✅ event Transfer(address indexed from, address indexed to, uint256 value);
        
        INVALID PATTERNS (DO NOT USE):
        ❌ require(condition, "Error: " + someVariable);
        ❌ string.isNotEmpty(str)
        ❌ string(uint256Value)
        ❌ balanceOf[address]
        ❌ function incomplete() { ... }
        ❌ import statements
        
        Security Considerations (MANDATORY):
        - Include reentrancy guards where needed (use bool private locked pattern)
        - Add proper access control (owner/admin patterns with address public owner)
        - Implement input validation for all parameters (require statements)
        - Add checks for zero address: require(addr != address(0), "Zero address");
        - Validate amounts: require(amount > 0, "Amount must be positive");
        - Include event emissions for all state changes
        - Handle edge cases properly
        - Add pause functionality for critical contracts (bool private paused)
        - Implement proper error messages (simple strings only)
        
        Code Quality (MANDATORY):
        - Ensure all syntax is correct and compiles
        - Use proper Solidity formatting
        - All functions must be properly closed with complete implementations
        - No missing semicolons or commas
        - Proper pragma declaration at the top
        - NO placeholders or ellipsis (...) - write complete code
        - Every contract must be fully implemented
        - Add comprehensive NatSpec documentation
        - Test all code patterns for compilation before including`
          },
          {
            role: "user",
            content: `Generate a HIGH-QUALITY, PRODUCTION-READY, COMPILABLE contract with these specifications:
        Template: ${selectedTemplate.name}
        Base Code: ${selectedTemplate.baseCode || 'Create new contract'}
        Custom Features: ${customFeatures || 'Standard features'}
        Parameters: ${JSON.stringify(contractParams)}
        
        CRITICAL INSTRUCTIONS:
        1. Write ONE complete contract with ALL functionality inline
        2. MUST compile without errors in Solidity 0.8.19
        3. Use ONLY valid Solidity syntax - no string concatenation, no invalid casts
        4. DO NOT create abstract contracts or use inheritance
        5. DO NOT use placeholders like "...", "{ ... }", or incomplete implementations
        6. If creating a token, implement ALL ERC20 functions directly in the contract
        7. Include complete function bodies for: transfer, approve, transferFrom, mint, burn
        8. Define ALL state variables: mapping(address => uint256) private balances, etc.
        9. Implement ALL events: event Transfer(address indexed from, address indexed to, uint256 value);
        10. Add comprehensive security checks in every function
        11. Use simple string literals in require statements
        12. Include detailed NatSpec comments
        13. This contract MUST compile and score 4-5 stars
        
        EXAMPLE OF VALID SOLIDITY CODE:
        \`\`\`solidity
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        
        contract MyToken {
            string public name;
            string public symbol;
            uint8 public decimals = 18;
            uint256 public totalSupply;
            address public owner;
            
            mapping(address => uint256) private balances;
            mapping(address => mapping(address => uint256)) private allowances;
            
            event Transfer(address indexed from, address indexed to, uint256 value);
            event Approval(address indexed owner, address indexed spender, uint256 value);
            
            constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
                name = _name;
                symbol = _symbol;
                owner = msg.sender;
                totalSupply = _initialSupply * 10**decimals;
                balances[msg.sender] = totalSupply;
                emit Transfer(address(0), msg.sender, totalSupply);
            }
            
            function balanceOf(address account) public view returns (uint256) {
                return balances[account];
            }
            
            function transfer(address to, uint256 amount) public returns (bool) {
                require(to != address(0), "Transfer to zero address");
                require(balances[msg.sender] >= amount, "Insufficient balance");
                
                balances[msg.sender] -= amount;
                balances[to] += amount;
                emit Transfer(msg.sender, to, amount);
                return true;
            }
        }
        \`\`\`
        
        Return ONLY this exact JSON format with valid, compilable Solidity code:
        {
          "code": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.19;\\n\\ncontract YourContract {\\n  // Complete implementation here\\n}",
          "features": ["list of implemented features"],
          "securityNotes": ["list of security measures implemented"]
        }
        
        The code field must contain ONLY valid Solidity syntax that compiles without errors.
        Every function must have a complete implementation.
        This must be a 4-5 star quality contract that compiles successfully.`
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

      // Enhanced code cleaning to remove markdown and fix common issues
      let cleanedCode = validatedResponse.code;
      if (typeof cleanedCode === 'string') {
        cleanedCode = cleanedCode
          // Remove markdown code block markers
          .replace(/```solidity\n?/g, '')
          .replace(/```javascript\n?/g, '')
          .replace(/```\n?/g, '')
          // Remove escaped newlines and fix formatting
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          // Remove any leading/trailing whitespace
          .trim();
        
        // Validate it starts with SPDX or pragma
        if (!cleanedCode.includes('SPDX-License-Identifier') && !cleanedCode.startsWith('pragma')) {
          console.warn('Generated code missing license or pragma, using template');
          if (selectedTemplate.baseCode) {
            cleanedCode = selectedTemplate.baseCode;
          }
        }
        
        // Check for placeholders that indicate incomplete code
        const hasPlaceholders = 
          cleanedCode.includes('{ ... }') ||
          cleanedCode.includes('{...}') ||
          cleanedCode.includes('// ...') ||
          /contract\s+\w+\s*\{\s*\.\.\.\s*\}/.test(cleanedCode);
        
        if (hasPlaceholders) {
          console.warn('Generated code contains placeholders, using template');
          setError('AI generated incomplete code with placeholders. Using template instead.');
          if (selectedTemplate.baseCode) {
            cleanedCode = selectedTemplate.baseCode;
          }
        }
        
        // Check for common Solidity syntax errors
        const commonErrors = [
          { pattern: /string\s*\+\s*/, message: 'String concatenation with + is not supported in Solidity' },
          { pattern: /string\.isNotEmpty/, message: 'string.isNotEmpty() does not exist in Solidity' },
          { pattern: /string\s*\(\s*uint/, message: 'Cannot cast uint to string in Solidity' },
          { pattern: /balanceOf\s*\[/, message: 'Use balances[address] or implement balanceOf() function' },
        ];
        
        for (const { pattern, message } of commonErrors) {
          if (pattern.test(cleanedCode)) {
            console.warn(`Detected syntax error: ${message}`);
            setError(`AI generated code with syntax error: ${message}. Using template instead.`);
            if (selectedTemplate.baseCode) {
              cleanedCode = selectedTemplate.baseCode;
            }
            break;
          }
        }
      }

      setGeneratedCode(cleanedCode);
      setSecurityNotes(validatedResponse.securityNotes);
    } catch (error: any) {
      console.error('Generation failed:', error);
      
      // Handle specific API errors
      if (error?.message?.includes('service_tier_capacity_exceeded') || error?.message?.includes('429')) {
        setError('AI service is currently at capacity. Please try again in a few moments or use the template code below.');
      } else if (error?.message?.includes('rate_limit')) {
        setError('Rate limit reached. Please wait a moment before trying again.');
      } else if (error?.name === 'ZodError') {
        setError('AI generated invalid response format. Using template code instead.');
      } else {
        setError('Failed to generate contract. Using template code instead.');
      }
      
      // Always fall back to template code if available
      if (selectedTemplate?.baseCode) {
        setGeneratedCode(selectedTemplate.baseCode);
        setError('AI generation failed. Showing template code - you can edit it as needed.');
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
      
      // Enhanced code cleaning before deployment to remove any artifacts
      let cleanCode = displayedCode;
      if (typeof cleanCode === 'string') {
        cleanCode = cleanCode
          // Remove markdown code block markers
          .replace(/```solidity\n?/g, '')
          .replace(/```javascript\n?/g, '')
          .replace(/```\n?/g, '')
          // Fix escaped characters
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          // Remove leading/trailing whitespace
          .trim();
      }
      
      // Validate we're on 0G Galileo Testnet
      const network = await provider.getNetwork();
      const currentChainId = '0x' + network.chainId.toString(16).toUpperCase();

      if (currentChainId.toLowerCase() !== CHAIN_CONFIG.zeroGTestnet.chainId.toLowerCase()) {
        throw new Error(`Please switch to 0G Galileo Testnet to deploy contracts. Current chain: ${currentChainId}, Expected: ${CHAIN_CONFIG.zeroGTestnet.chainId}`);
      }

      // Compile contract with cleaned code
      const response = await fetch('/api/compile-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: cleanCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorDetails = errorData.details || (await response.text());
        
        // Show compilation error with helpful message
        const errorMessage = `Compilation failed: ${errorDetails}`;
        setDeploymentError(errorMessage);
        
        // If it's a syntax error, suggest using the template
        if (errorDetails.includes('ParserError') || errorDetails.includes('SyntaxError')) {
          setError('The generated code has syntax errors. Try regenerating or edit the code manually before deploying.');
        }
        
        throw new Error(errorMessage);
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

      // Deploy contract with proper gas settings for 0G Galileo Testnet
      const contract = await contractFactory.deploy(...constructorArgs, {
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'), // 30 Gwei tip (above minimum of 25 Gwei)
        maxFeePerGas: ethers.parseUnits('50', 'gwei'), // 50 Gwei max fee
      });
      const receipt = await contract.deploymentTransaction()?.wait();

      if (!receipt?.contractAddress) {
        throw new Error('Failed to get contract address');
      }

      setDeployedAddress(receipt.contractAddress);

      // If audit toggle is enabled, automatically audit the contract
      if (auditOnDeploy) {
        await auditDeployedContract(cleanCode, receipt.contractAddress, receipt.hash);
      }

    } catch (error: any) {
      console.error('Deployment failed:', error);
      
      // Handle specific error types
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        // User rejected the transaction
        setDeploymentError('Transaction cancelled by user');
        setError('You cancelled the deployment transaction');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setDeploymentError('Insufficient funds for gas');
        setError('You don\'t have enough 0G tokens to pay for gas. Get testnet tokens from the faucet.');
      } else if (error.code === 'NETWORK_ERROR') {
        setDeploymentError('Network connection error');
        setError('Network error. Please check your connection and try again.');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        setDeploymentError('Gas estimation failed');
        setError('Contract deployment would fail. Check constructor parameters and contract code.');
      } else if (error.message?.includes('user rejected')) {
        setDeploymentError('Transaction cancelled');
        setError('You cancelled the deployment transaction');
      } else if (error.message?.includes('insufficient funds')) {
        setDeploymentError('Insufficient funds');
        setError('You don\'t have enough 0G tokens to pay for gas. Get testnet tokens from the faucet.');
      } else {
        // Generic error
        setDeploymentError(error.message || 'Deployment failed');
        setError(error.message || 'Deployment failed. Please try again.');
      }
    } finally {
      setIsDeploying(false);
    }
  };

  // Audit deployed contract and store report on 0G Storage
  // Audit deployed contract and store report on 0G Storage
  const auditDeployedContract = async (contractCode: string, contractAddress: string, txHash: string) => {
    setIsAuditing(true);
    try {
      // Call AI audit API (same as audit page)
      const auditResponse = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode }),
      });

      if (!auditResponse.ok) {
        throw new Error('Audit analysis failed');
      }

      const auditData = await auditResponse.json();
      
      // Extract analysis from the response (API returns { analysis: {...} })
      const analysis = auditData.analysis || auditData;
      
      // Validate analysis has required fields
      if (!analysis.summary) {
        analysis.summary = 'Security analysis completed';
      }
      if (!analysis.vulnerabilities) {
        analysis.vulnerabilities = { critical: [], high: [], medium: [], low: [] };
      }
      if (!analysis.stars) {
        analysis.stars = 3;
      }
      
      // Prepare report data in the same format as audit page
      const reportData = {
        analysis,
        contractCode,
        timestamp: new Date().toISOString(),
        provider: 'Mistral AI',
        model: 'mistral-large-latest',
        contractAddress,
        deploymentTxHash: txHash,
      };

      // Upload to 0G Storage using the same format as audit page
      const uploadResponse = await fetch('/api/0g-storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: JSON.stringify(reportData),  // Same as audit page
          metadata: {
            type: 'audit-report',
            contractAddress,
            deploymentTxHash: txHash,
          }
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload report to 0G Storage: ${errorData.details || errorData.error}`);
      }

      const { reportHash } = await uploadResponse.json();

      // Register audit on blockchain using the correct ABI
      const { provider, signer } = await connectWallet();
      
      // Import the correct contract ABI and address
      const CONTRACT_ADDRESSES = {
        zeroGTestnet: '0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0'
      };
      
      const AUDIT_REGISTRY_ABI = [
        'function registerAudit(bytes32 contractHash, uint8 stars, uint8 criticalCount, uint8 highCount, uint8 mediumCount, bytes32 reportHash, string memory summaryPreview, bytes32 computeJobId) external'
      ];
      
      const auditContract = new ethers.Contract(
        CONTRACT_ADDRESSES.zeroGTestnet,
        AUDIT_REGISTRY_ABI,
        signer
      );

      // Prepare parameters
      const contractHash = ethers.keccak256(ethers.toUtf8Bytes(contractCode));
      
      // Ensure reportHash is properly formatted as bytes32
      let reportHashBytes32 = reportHash;
      if (reportHashBytes32.length < 66) {
        reportHashBytes32 = reportHashBytes32 + '0'.repeat(66 - reportHashBytes32.length);
      }
      
      // Placeholder compute job ID (generate random bytes32)
      const generatePlaceholderJobId = (): string => {
        const randomBytes = Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 256)
        );
        return '0x' + randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
      };
      const computeJobIdBytes32 = generatePlaceholderJobId();
      
      // Summary preview (max 100 chars)
      const summaryPreview = (analysis.summary || 'Security analysis completed').substring(0, 100);
      
      // Count vulnerabilities with safe fallbacks
      const criticalCount = analysis.vulnerabilities?.critical?.length || 0;
      const highCount = analysis.vulnerabilities?.high?.length || 0;
      const mediumCount = analysis.vulnerabilities?.medium?.length || 0;

      // Get fee data for 0G network
      const feeData = await provider.getFeeData();
      const minPriorityFee = ethers.parseUnits('25', 'gwei');
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
        ? feeData.maxPriorityFeePerGas
        : minPriorityFee;
      const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > minPriorityFee
        ? feeData.maxFeePerGas
        : minPriorityFee * BigInt(2);

      // Call registerAudit with all required parameters
      const tx = await auditContract.registerAudit(
        contractHash,
        analysis.stars,
        criticalCount,
        highCount,
        mediumCount,
        reportHashBytes32,
        summaryPreview,
        computeJobIdBytes32,
        { maxPriorityFeePerGas, maxFeePerGas }
      );
      
      const receipt = await tx.wait();

      setAuditReport({ ...analysis, reportHash, txHash: receipt.transactionHash });
      
    } catch (error: any) {
      console.error('Audit failed:', error);
      
      // Handle specific audit error types
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setError('Audit cancelled: You rejected the blockchain registration transaction');
      } else if (error.message?.includes('user rejected')) {
        setError('Audit cancelled: You rejected the blockchain registration transaction');
      } else if (error.message?.includes('Audit analysis failed')) {
        setError('Deployment successful but AI audit failed. You can audit the contract manually from the Audit page.');
      } else if (error.message?.includes('Failed to upload report')) {
        setError('Deployment successful but failed to store audit report on 0G Storage. You can audit the contract manually from the Audit page.');
      } else if (error.message?.includes('insufficient funds')) {
        setError('Deployment successful but audit registration failed due to insufficient funds. You can audit the contract manually from the Audit page.');
      } else {
        setError(`Deployment successful but audit failed: ${error.message}. You can audit the contract manually from the Audit page.`);
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Helper functions
  const getExplorerUrl = () => {
    if (!currentChain || !deployedAddress) return null;
    const baseUrl = CHAIN_CONFIG[currentChain].blockExplorerUrls[0];
    
    // Check if it's a token contract (ERC20 or ERC721/NFT)
    const isToken = selectedTemplate?.name.toLowerCase().includes('token') || 
                    selectedTemplate?.name.toLowerCase().includes('nft') ||
                    selectedTemplate?.name.toLowerCase().includes('erc');
    
    const path = isToken ? 'token' : 'address';
    return `${baseUrl}/${path}/${deployedAddress}`;
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setWalletConnected(true);
      await detectCurrentNetwork();
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      // Handle specific wallet connection errors
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setError('Wallet connection cancelled');
      } else if (error.message?.includes('user rejected')) {
        setError('You cancelled the wallet connection request');
      } else if (error.message?.includes('No Ethereum provider')) {
        setError('No wallet detected. Please install MetaMask or another Web3 wallet.');
      } else if (error.message?.includes('Chain')) {
        setError('Please switch to 0G Galileo Testnet in your wallet');
      } else {
        setError(error.message || 'Failed to connect wallet. Please try again.');
      }
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
      <div className="absolute inset-0 h-full w-full theme-grid-overlay"></div>
      <div className="absolute inset-0 h-full w-full theme-grid-fade"></div>
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
              className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1">{error}</p>
                {selectedTemplate?.baseCode && (
                  <button
                    onClick={() => {
                      setGeneratedCode(selectedTemplate.baseCode);
                      setError(null);
                    }}
                    className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Use Template
                  </button>
                )}
              </div>
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
          <div className="relative bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col p-4 h-full transition-colors duration-300 overflow-hidden">
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              {/* Template Selection */}
              <div className="border-b border-blue-900/50 pb-4 flex-shrink-0">
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
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="text-blue-400" size={20} weight="duotone" />
                    <span className="font-mono text-white">Contract Parameters</span>
                  </div>

                  <div className="space-y-4 overflow-y-auto custom-scrollbar h-full">
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
            <div className="pt-4 border-t border-blue-900/50 space-y-3">
              {selectedTemplate && (selectedTemplate.name.includes('Token') || selectedTemplate.name.includes('NFT')) && (
                <div className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  💡 <strong>Tip:</strong> Token templates are production-ready. You can deploy them directly or use "Generate Contract" to customize with AI.
                </div>
              )}
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
          <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col transition-colors duration-300 overflow-hidden">
            <div className="p-4 border-b border-blue-900/50 flex justify-between items-center flex-shrink-0">
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

            <div className="flex-1 overflow-hidden">
              {displayedCode ? (
                <textarea
                  value={displayedCode}
                  onChange={handleManualCodeChange}
                  className="w-full h-full p-6 font-mono text-sm text-white bg-transparent border-none resize-none outline-none overflow-y-auto custom-scrollbar"
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
              <div className="p-4 border-t border-blue-900/50 space-y-3">
                {/* Audit Toggle */}
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield size={20} className="text-blue-400" weight="fill" />
                    <div>
                      <p className="text-sm font-semibold text-white">Auto-Audit on Deploy</p>
                      <p className="text-xs text-gray-400">Audit and store report on 0G Storage</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAuditOnDeploy(!auditOnDeploy)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      auditOnDeploy ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        auditOnDeploy ? 'transform translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Auditing Status */}
                {isAuditing && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                    <CircleNotch className="animate-spin" size={16} weight="bold" />
                    <span className="text-sm">Auditing contract and storing report...</span>
                  </div>
                )}

                {/* Audit Report Success */}
                {auditReport && (
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-xl shadow-lg shadow-green-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Shield size={18} className="text-green-400" weight="fill" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-green-400">Audit Complete</span>
                          <p className="text-xs text-gray-400">Report stored on 0G Storage</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1.5 rounded-full">
                        <span className="text-lg font-bold text-green-400">{auditReport.stars}</span>
                        <span className="text-yellow-400">⭐</span>
                      </div>
                    </div>
                    
                    {/* Vulnerability Summary */}
                    {auditReport.vulnerabilities && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {auditReport.vulnerabilities.critical?.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400">
                            {auditReport.vulnerabilities.critical.length} Critical
                          </span>
                        )}
                        {auditReport.vulnerabilities.high?.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400">
                            {auditReport.vulnerabilities.high.length} High
                          </span>
                        )}
                        {auditReport.vulnerabilities.medium?.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400">
                            {auditReport.vulnerabilities.medium.length} Medium
                          </span>
                        )}
                        {auditReport.vulnerabilities.low?.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400">
                            {auditReport.vulnerabilities.low.length} Low
                          </span>
                        )}
                      </div>
                    )}
                    
                    <a
                      href={`/report/${auditReport.reportHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-all duration-200 text-sm font-semibold text-green-400"
                    >
                      <FileCode size={16} weight="bold" />
                      View Full Report
                      <ArrowRight size={14} weight="bold" />
                    </a>
                  </div>
                )}

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
                    disabled={isDeploying || isAuditing}
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
                        Deploy to 0G Testnet
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
