"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mistral } from '@mistralai/mistralai';
import {
  FileText,
  Copy,
  Check,
  Function as FunctionIcon,
  Database,
  Bell,
  CircleNotch,
  DownloadSimple,
  Article,
  BookOpen,
  FilePdf,
  Users,
  Briefcase,
  GraduationCap,
  ShareNetwork
} from 'phosphor-react';
import { generateDocumentationPDF } from '@/utils/generateDocsPDF';

const mistralClient = new Mistral({
  apiKey: process.env.NEXT_PUBLIC_MISTRAL_API_KEY!
});

interface Parameter {
  name: string;
  type: string;
  description?: string;
  indexed?: boolean;
}

interface Function {
  name: string;
  description: string;
  params: Parameter[];
  visibility: string;
}

interface Event {
  name: string;
  description: string;
  params: Parameter[];
}

interface Variable {
  name: string;
  type: string;
  visibility: string;
  description: string;
}

interface Documentation {
  name: string;
  description: string;
  version: string;
  license: string;
  functions?: Function[];
  events?: Event[];
  variables?: Variable[];
}

const PURPOSE_OPTIONS = [
  {
    id: 'team',
    label: 'Team Collaboration',
    description: 'Share with development team members',
    icon: <Users size={20} weight="duotone" />
  },
  {
    id: 'client',
    label: 'Client Presentation',
    description: 'Present to clients or stakeholders',
    icon: <Briefcase size={20} weight="duotone" />
  },
  {
    id: 'audit',
    label: 'Security Audit',
    description: 'Submit for security review',
    icon: <FileText size={20} weight="duotone" />
  },
  {
    id: 'education',
    label: 'Educational Purpose',
    description: 'Teaching or learning material',
    icon: <GraduationCap size={20} weight="duotone" />
  },
  {
    id: 'public',
    label: 'Public Documentation',
    description: 'Open source or public sharing',
    icon: <ShareNetwork size={20} weight="duotone" />
  },
  {
    id: 'custom',
    label: 'Custom Purpose',
    description: 'Specify your own purpose',
    icon: <Article size={20} weight="duotone" />
  }
];

const ContractDocsGenerator = () => {
  const [contractCode, setContractCode] = useState<string>('');
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  
  // New states for purpose selection - NOW ASKED BEFORE GENERATION
  const [selectedPurpose, setSelectedPurpose] = useState<string>('team');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [recipientInfo, setRecipientInfo] = useState<string>('');
  const [technicalLevel, setTechnicalLevel] = useState<string>('intermediate');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown'>('pdf');

  // Get purpose text helper
  const getPurposeText = () => {
    if (selectedPurpose === 'custom') {
      return customPurpose || 'Custom documentation purpose';
    }
    const purpose = PURPOSE_OPTIONS.find(p => p.id === selectedPurpose);
    return purpose ? purpose.description : 'General documentation';
  };

  const generateDocs = async () => {
    if (!contractCode.trim()) return;
    setIsGenerating(true);
    setError(null);
    setShowConfigModal(false);

    try {
      const purposeText = getPurposeText();
      
      // Enhanced prompt that considers purpose, recipient, and technical level
      const prompt = `You are an expert Solidity smart contract analyzer. Analyze this smart contract and provide a structured documentation object.
      
      DOCUMENTATION CONTEXT:
      - Purpose: ${purposeText}
      - Intended for: ${recipientInfo || 'General audience'}
      - Technical Level: ${technicalLevel}
      
      INSTRUCTIONS:
      - Tailor descriptions to the ${technicalLevel} technical level
      - Focus on aspects relevant to: ${purposeText}
      - Use appropriate terminology for the intended audience
      - For "beginner" level: Use simple language, explain concepts
      - For "intermediate" level: Balance technical detail with clarity
      - For "advanced" level: Use precise technical terminology, include implementation details
      
      The response should be ONLY a valid JSON object with the following structure:
      {
        "name": "contract name",
        "description": "brief description of what the contract does",
        "version": "solidity version",
        "license": "license type",
        "functions": [
          {
            "name": "function name",
            "description": "what the function does",
            "params": [
              {
                "name": "parameter name",
                "type": "parameter type",
                "description": "parameter description"
              }
            ],
            "visibility": "public/private/internal/external"
          }
        ],
        "events": [
          {
            "name": "event name",
            "description": "what the event represents",
            "params": [
              {
                "name": "parameter name",
                "type": "parameter type",
                "indexed": boolean
              }
            ]
          }
        ],
        "variables": [
          {
            "name": "variable name",
            "type": "variable type",
            "visibility": "public/private/internal",
            "description": "what the variable represents"
          }
        ]
      }

      Contract code to analyze:
      ${contractCode}

      Important:
      1. Return ONLY the JSON object, no additional text or backticks
      2. Include all public and external functions
      3. Document all events
      4. Include all public state variables
      5. Keep descriptions concise but informative
      6. Ensure the JSON is valid and properly formatted
      `;

      const response = await mistralClient.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      });

      let jsonString = response.choices?.[0]?.message?.content || '';

      if (typeof jsonString === 'string') {
        jsonString = jsonString.trim();
      }
        if (typeof jsonString === 'string' && jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7).trimStart();
      }
        if (typeof jsonString === 'string' && jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3).trimEnd();
      }

      try {
        const parsedDocs = JSON.parse(typeof jsonString === 'string' ? jsonString : '') as Documentation;
        setDocumentation(parsedDocs);
      } catch (parseError) {
        console.error('Failed to parse Mistral response:', parseError, jsonString);
        setError('Failed to parse contract documentation. Ensure the smart contract is valid. Please try again.');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate documentation. Please try again.');
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

  const downloadDocs = () => {
    if (!documentation) return;
    
    const purposeText = getPurposeText();

    if (exportFormat === 'pdf') {
      // Generate PDF with purpose and recipient info
      generateDocumentationPDF(documentation, purposeText, recipientInfo);
    } else {
      // Generate enhanced markdown with purpose and recipient info
      const markdownContent = `# ${documentation.name}

${documentation.description}

---

## Document Information

**Version:** ${documentation.version}  
**License:** ${documentation.license}  
**Purpose:** ${purposeText}  
${recipientInfo ? `**For:** ${recipientInfo}  ` : ''}
**Generated:** ${new Date().toLocaleString()}  
**Generated by:** BlockPilot - Smart Contract Security Platform

---

## Functions

${documentation.functions?.map(func => `### \`${func.name}\`

**Visibility:** \`${func.visibility}\`

${func.description}

${func.params.length ? `**Parameters:**

${func.params.map(param => `- **\`${param.name}\`** (\`${param.type}\`) - ${param.description || 'No description'}`).join('\n')}` : '*No parameters*'}

---`).join('\n\n')}

## Events

${documentation.events?.map(event => `### \`${event.name}\`

${event.description}

${event.params.length ? `**Parameters:**

${event.params.map(param => `- **\`${param.name}\`** (\`${param.type}\`)${param.indexed ? ' - *indexed*' : ''}`).join('\n')}` : '*No parameters*'}

---`).join('\n\n')}

## State Variables

${documentation.variables?.map(variable => `### \`${variable.name}\`

**Type:** \`${variable.type}\`  
**Visibility:** \`${variable.visibility}\`

${variable.description}

---`).join('\n\n')}

---

*This documentation was generated by BlockPilot for ${purposeText.toLowerCase()}${recipientInfo ? ` and prepared for ${recipientInfo}` : ''}.*`;

      // Create blob and download
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentation.name.toLowerCase().replace(/\s+/g, '-')}-documentation.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setShowExportModal(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 h-full w-full theme-grid-overlay"></div>
      <div className="absolute inset-0 h-full w-full theme-grid-fade"></div>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
              <BookOpen size={24} className="text-blue-400" weight="fill" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tighter">Smart Contract Documentation</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-150px)]">
          {/* Left Panel - Contract Input */}
          <div className="relative bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col p-4 h-full transition-colors duration-300">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-blue-900/50">
                <FileText className="text-blue-400" size={20} weight="duotone" />
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
                onClick={() => setShowConfigModal(true)}
                disabled={!contractCode || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:bg-blue-950 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <CircleNotch className="animate-spin" size={20} weight="bold" />
                    Generating Documentation...
                  </>
                ) : (
                  <>
                    <Article size={20} weight="fill" />
                    Generate Documentation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Documentation Output */}
          <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col transition-colors duration-300 overflow-hidden">
            <div className="p-4 border-b border-blue-900/50 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Article className="text-blue-400" size={20} weight="duotone" />
                <span className="font-mono text-white">Documentation</span>
              </div>
              {documentation && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(documentation, null, 2))}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-blue-500/10"
                  >
                    {copySuccess ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                    {copySuccess ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="text-white bg-blue-600 hover:bg-blue-700 text-sm flex items-center gap-1 transition-colors duration-200 px-3 py-1.5 rounded-lg font-medium"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    Export Documentation
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                {documentation ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-blue-400">{documentation.name}</h2>
                    <p className="text-gray-300">{documentation.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-sm bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">v{documentation.version}</span>
                      <span className="text-sm bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">{documentation.license} License</span>
                    </div>
                  </div>

                  {documentation.functions?.length ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <FunctionIcon className="text-blue-400" size={20} weight="duotone" />
                        <h3 className="text-lg font-semibold text-blue-400">Functions</h3>
                      </div>
                      <div className="space-y-4">
                        {documentation.functions.map((func, index) => (
                          <div key={index} className="bg-black/50 rounded-2xl p-4 border border-blue-900/50 hover:border-blue-500/30 transition-colors duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-blue-400">{func.name}</span>
                              <span className="text-sm px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{func.visibility}</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">{func.description}</p>
                            {func.params?.length > 0 && (
                              <div className="mt-2 bg-black/30 rounded-lg p-3 border border-blue-900/30">
                                <div className="text-sm text-blue-300 mb-2">Parameters:</div>
                                {func.params.map((param, i) => (
                                  <div key={i} className="ml-3 text-sm flex items-start mb-1">
                                    <span className="text-blue-400 font-mono">{param.name}</span>
                                    <span className="text-gray-500 mx-1">({param.type})</span>
                                    <span className="text-gray-300"> - {param.description}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(documentation.events?.length ?? 0) > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Bell className="text-blue-400" size={20} weight="duotone" />
                        <h3 className="text-lg font-semibold text-blue-400">Events</h3>
                      </div>
                      <div className="space-y-4">
                        {documentation.events?.map((event, index) => (
                          <div key={index} className="bg-black/50 rounded-2xl p-4 border border-blue-900/50 hover:border-blue-500/30 transition-colors duration-200">
                            <div className="font-mono text-blue-400 mb-2">{event.name}</div>
                            <p className="text-sm text-gray-300 mb-3">{event.description}</p>
                            <div className="space-y-1 bg-black/30 rounded-lg p-3 border border-blue-900/30">
                              {event.params?.map((param, i) => (
                                <div key={i} className="text-sm flex items-center">
                                  <span className="text-blue-400 font-mono">{param.name}</span>
                                  <span className="text-gray-500 mx-1">({param.type})</span>
                                  {param.indexed && (
                                    <span className="text-sm px-2 py-0.5 ml-2 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">indexed</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(documentation.variables?.length ?? 0) > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Database className="text-blue-400" size={20} weight="duotone" />
                        <h3 className="text-lg font-semibold text-blue-400">State Variables</h3>
                      </div>
                      <div className="space-y-4">
                        {documentation.variables?.map((variable, index) => (
                          <div key={index} className="bg-black/50 rounded-2xl p-4 border border-blue-900/50 hover:border-blue-500/30 transition-colors duration-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-blue-400">{variable.name}</span>
                              <div className="flex space-x-2">
                                <span className="text-sm px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{variable.type}</span>
                                <span className="text-sm px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">{variable.visibility}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-300">{variable.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-blue-400 p-8">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                      <BookOpen size={80} className="text-blue-400 relative z-10" weight="duotone" />
                    </div>
                    <h3 className="text-xl font-mono mb-4">Contract Documentation</h3>
                    <p className="text-blue-300 mb-6 max-w-md mx-auto">
                      Paste your Solidity code on the left panel and click 'Generate Documentation' to create comprehensive docs
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        Function Documentation
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        Event Descriptions
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        State Variables
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                        Markdown Export
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Configuration Modal - BEFORE Generation */}
        <AnimatePresence>
          {showConfigModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowConfigModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                      <Article size={24} className="text-blue-400" weight="fill" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Configure Documentation</h2>
                  </div>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="text-gray-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-sm font-medium text-blue-400 mb-3">
                      What is this documentation for? *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PURPOSE_OPTIONS.map((purpose) => (
                        <button
                          key={purpose.id}
                          onClick={() => setSelectedPurpose(purpose.id)}
                          className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                            selectedPurpose === purpose.id
                              ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/10'
                              : 'border-blue-900/50 bg-black/30 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-blue-400">{purpose.icon}</div>
                            <span className="font-semibold text-white">{purpose.label}</span>
                          </div>
                          <p className="text-sm text-gray-400">{purpose.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Purpose Input */}
                  {selectedPurpose === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-blue-400 mb-2">
                        Specify your purpose *
                      </label>
                      <textarea
                        value={customPurpose}
                        onChange={(e) => setCustomPurpose(e.target.value)}
                        placeholder="e.g., Internal code review for Q4 2024 release"
                        className="w-full px-4 py-3 bg-black/50 border border-blue-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none"
                        rows={3}
                      />
                    </motion.div>
                  )}

                  {/* Recipient Information */}
                  <div>
                    <label className="block text-sm font-medium text-blue-400 mb-2">
                      For whom? (Optional)
                    </label>
                    <input
                      type="text"
                      value={recipientInfo}
                      onChange={(e) => setRecipientInfo(e.target.value)}
                      placeholder="e.g., Development Team, John Doe, Security Auditors"
                      className="w-full px-4 py-3 bg-black/50 border border-blue-900/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Technical Level */}
                  <div>
                    <label className="block text-sm font-medium text-blue-400 mb-3">
                      Technical Level of Audience *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'beginner', label: 'Beginner', desc: 'Simple explanations' },
                        { id: 'intermediate', label: 'Intermediate', desc: 'Balanced detail' },
                        { id: 'advanced', label: 'Advanced', desc: 'Technical depth' }
                      ].map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setTechnicalLevel(level.id)}
                          className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                            technicalLevel === level.id
                              ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/10'
                              : 'border-blue-900/50 bg-black/30 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="font-semibold text-white text-sm mb-1">{level.label}</div>
                          <p className="text-xs text-gray-400">{level.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Article size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="duotone" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          Documentation will be tailored to:
                        </h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Purpose: {getPurposeText()}</li>
                          <li>• Audience: {recipientInfo || 'General audience'}</li>
                          <li>• Technical Level: {technicalLevel.charAt(0).toUpperCase() + technicalLevel.slice(1)}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowConfigModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateDocs}
                      disabled={selectedPurpose === 'custom' && !customPurpose.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Article size={20} weight="fill" />
                      Generate Documentation
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal - AFTER Generation */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 max-w-xl w-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                      <DownloadSimple size={24} className="text-blue-400" weight="fill" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Export Documentation</h2>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-blue-400 mb-3">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setExportFormat('pdf')}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          exportFormat === 'pdf'
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/10'
                            : 'border-blue-900/50 bg-black/30 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <FilePdf size={24} className="text-blue-400" weight="duotone" />
                          <span className="font-semibold text-white">PDF</span>
                        </div>
                        <p className="text-sm text-gray-400">Professional formatted document</p>
                      </button>
                      <button
                        onClick={() => setExportFormat('markdown')}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          exportFormat === 'markdown'
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/10'
                            : 'border-blue-900/50 bg-black/30 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <FileText size={24} className="text-blue-400" weight="duotone" />
                          <span className="font-semibold text-white">Markdown</span>
                        </div>
                        <p className="text-sm text-gray-400">Developer-friendly format</p>
                      </button>
                    </div>
                  </div>

                  {/* Preview Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      {exportFormat === 'pdf' ? (
                        <FilePdf size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="duotone" />
                      ) : (
                        <FileText size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="duotone" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {exportFormat === 'pdf' ? 'PDF will include:' : 'Markdown will include:'}
                        </h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Complete contract documentation</li>
                          <li>• Purpose and recipient information</li>
                          <li>• Functions, events, and state variables</li>
                          <li>• {exportFormat === 'pdf' ? 'Professional formatting with BlockPilot branding' : 'Clean markdown formatting'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={downloadDocs}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <DownloadSimple size={20} weight="fill" />
                      Download {exportFormat === 'pdf' ? 'PDF' : 'Markdown'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContractDocsGenerator;
