'use client';

import { Shield } from 'phosphor-react';

export function InitialState() {
  return (
    <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex items-center justify-center text-blue-400 p-8">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
          <Shield size={80} className="text-blue-400 relative z-10" weight="duotone" />
        </div>
        <h3 className="text-xl font-mono mb-4">Smart Contract Analyzer</h3>
        <p className="text-blue-300 mb-6 max-w-md mx-auto">
          Paste your Solidity code on the left panel and click &apos;Analyze Contract&apos; to get a comprehensive security assessment
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
            Vulnerability Detection
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
            Security Scoring
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
            Gas Optimization
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
            On-Chain Verification
          </span>
        </div>
      </div>
    </div>
  );
}
