'use client';

import { Cube } from 'phosphor-react';

export function AnalyzingState() {
  return (
    <div className="h-full bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col items-center justify-center text-center p-8">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <Cube size={96} className="text-blue-400 relative z-10 animate-pulse" weight="duotone" />
      </div>
      <h3 className="text-2xl font-mono text-white mb-4">Analyzing Your Code...</h3>
      <p className="text-blue-300 max-w-md">
        Our AI is meticulously reviewing your smart contract for vulnerabilities, gas inefficiencies, and other potential issues. This may take a moment.
      </p>
    </div>
  );
}
