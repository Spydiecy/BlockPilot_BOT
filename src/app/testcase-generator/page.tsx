// TestCaseGenerator.tsx
"use client"

import React, { JSX, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from '@mistralai/mistralai';
import {
  FileCode,
  Robot,
  CircleNotch,
  Copy,
  Check,
  TestTube,
  Code,
  Lightning
} from 'phosphor-react';

const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

type TestFramework = 'hardhat' | 'foundry' | 'remix';

interface TestingOption {
  id: TestFramework;
  name: string;
  description: string;
  icon: JSX.Element;
  features: string[];
}

const TESTING_OPTIONS: TestingOption[] = [
  {
    id: 'hardhat',
    name: 'Hardhat Tests',
    description: 'Generate JavaScript/TypeScript tests using Hardhat and Chai',
    icon: <TestTube size={24} weight="duotone" />,
    features: [
      'JavaScript/TypeScript',
      'Chai assertions',
      'Ethers.js integration',
      'Gas reporting'
    ]
  },
  {
    id: 'foundry',
    name: 'Foundry Tests',
    description: 'Generate Solidity-based tests using Foundry framework',
    icon: <Code size={24} weight="duotone" />,
    features: [
      'Solidity native',
      'Fuzzing support',
      'Gas optimization',
      'Fast execution'
    ]
  },
  {
    id: 'remix',
    name: 'Remix Manual Tests',
    description: 'Generate step-by-step manual testing instructions for Remix IDE',
    icon: <FileCode size={24} weight="duotone" />,
    features: [
      'GUI-based testing',
      'No setup required',
      'Interactive steps',
      'Visual verification'
    ]
  }
];

export default function TestCaseGenerator() {
  const [contractCode, setContractCode] = useState('');
  const [generatedTests, setGeneratedTests] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<TestFramework>('hardhat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getPromptForFramework = (code: string, framework: TestFramework) => {
    const basePrompt = `You are an expert in smart contract testing. Generate comprehensive test cases for the following smart contract:

Contract code:
${code}

Requirements:
- Test all main contract functions
- Include edge cases and error conditions
- Test access control
- Verify state changes
- Check event emissions
- Add gas optimization checks where relevant`;

    const frameworkSpecific = {
      hardhat: `
Additional Requirements:
- Use Hardhat and Chai with latest practices
- Include complete test setup with TypeScript
- Add proper describe/it blocks
- Include deployment scripts
- Add comprehensive assertions
- Include gas usage reporting
Return ONLY the complete test file code without any extra text.`,

      foundry: `
Additional Requirements:
- Use Foundry's Solidity testing framework
- Include setUp() function
- Use forge std assertions
- Add fuzzing where appropriate
- Include proper test annotations
- Add gas optimization tests
Return ONLY the complete test file code without any extra text.`,

      remix: `
Additional Requirements:
- Create step-by-step manual testing instructions
- Include specific input values to test
- Add expected outcomes for each step
- Include verification steps
- Add troubleshooting notes
- Include deployment instructions
Return a structured list of testing steps without any extra text.`
    };

    return basePrompt + frameworkSpecific[framework];
  };

  const generateTests = async () => {
    if (!contractCode.trim()) {
      setError('Please enter contract code to generate tests');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: getPromptForFramework(contractCode, selectedFramework),
          },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      });

      const generatedText = response.choices?.[0]?.message?.content || '';

      let cleanCode = '';
      if (typeof generatedText === 'string') {
        // Remove any markdown-style code blocks (```)
        cleanCode = generatedText
          .replace(/```[a-z]*\n/g, '')
          .replace(/```/g, '')
          .replace(/\*/g, '')
          .trim();
      } else {
        setGeneratedTests('');
      }

      setGeneratedTests(cleanCode);

    } catch (error) {
      console.error('Test generation failed:', error);
      setError('Failed to generate test cases. Please try again.');
    } finally {
      setIsGenerating(false);
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
              <TestTube size={24} className="text-blue-400" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tighter">Test Case Generator</h1>
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

        {/* Framework Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTING_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedFramework(option.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 text-left h-full hover:shadow-md
                  ${selectedFramework === option.id
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-blue-500/5'
                    : 'border-blue-900/50 hover:border-blue-500/50 bg-black/20'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-blue-400">
                    {option.icon}
                  </div>
                  <span className="font-semibold text-white">{option.name}</span>
                </div>
                <p className="text-xs text-blue-400 mb-2">{option.description}</p>
                <div className="flex flex-wrap gap-1">
                  {option.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Contract Input */}
          <div className="relative bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col p-4 h-full transition-colors duration-300">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-blue-900/50">
                <Code className="text-blue-400" size={20} weight="duotone" />
                <span className="font-mono text-white">Contract Input</span>
              </div>
              <textarea
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="// Paste your Solidity contract code here..."
                className="w-full flex-1 p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 custom-scrollbar code-editor overflow-y-auto"
              />
            </div>
            <div className="pt-4 border-t border-blue-900/50">
              <button
                onClick={generateTests}
                disabled={!contractCode || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:bg-blue-950 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} weight="bold" />
                    Generating {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}...
                  </>
                ) : (
                  <>
                    <Lightning size={20} weight="fill" />
                    Generate {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Generated Tests */}
          <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col transition-colors duration-300 overflow-hidden">
            <div className="p-4 border-b border-blue-900/50 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <TestTube className="text-blue-400" size={20} weight="duotone" />
                <span className="font-mono text-white">Generated {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.name}</span>
              </div>
              {generatedTests && (
                <button
                  onClick={() => copyToClipboard(generatedTests)}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-500/10"
                >
                  {copySuccess ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {generatedTests ? (
                <pre className="h-full p-6 font-mono text-sm whitespace-pre-wrap text-white overflow-y-auto custom-scrollbar">{generatedTests}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-blue-400 p-8">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                      <TestTube size={80} className="text-blue-400 relative z-10" weight="duotone" />
                    </div>
                    <h3 className="text-xl font-mono mb-4">Test Case Generator</h3>
                    <p className="text-blue-300 mb-6 max-w-md mx-auto">
                      Select a testing framework, paste your Solidity code, and generate comprehensive test cases
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {TESTING_OPTIONS.find(opt => opt.id === selectedFramework)?.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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