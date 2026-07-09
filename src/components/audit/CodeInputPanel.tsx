'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CircleNotch, FileText } from 'phosphor-react';

interface CodeInputPanelProps {
  code: string;
  setCode: (code: string) => void;
  analyzeContract: () => void;
  isAnalyzing: boolean;
  cooldown: number;
}

export function CodeInputPanel({ 
  code, 
  setCode, 
  analyzeContract, 
  isAnalyzing, 
  cooldown 
}: CodeInputPanelProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        setCode(fileContent);
      };
      reader.readAsText(file);
    }
  }, [setCode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sol'],
    },
    noClick: true, // The dropzone is the whole panel, but we don't want to trigger file dialog on click
  });

  return (
    <div {...getRootProps()} className="relative bg-black/50 rounded-2xl border border-blue-900/50 flex flex-col p-4 h-full transition-colors duration-300">
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl border-2 border-dashed border-blue-400">
          <FileText size={64} className="text-blue-400 mb-4" weight="duotone" />
          <p className="text-lg font-semibold text-white">Drop your Solidity file here</p>
        </div>
      )}
      <div className={`flex-1 flex flex-col ${isDragActive ? 'opacity-50' : 'opacity-100'}`}>
        <textarea
          // getInputProps is not needed here as the root div handles the dropzone context
          className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 custom-scrollbar code-editor"
          placeholder="// Paste your Solidity code here or drop a .sol file..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input {...getInputProps()} />
      </div>
      <div className={`pt-4 border-t border-blue-900/50 ${isDragActive ? 'opacity-50' : 'opacity-100'}`}>
        <button
          onClick={analyzeContract}
          disabled={isAnalyzing || cooldown > 0 || !code}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:bg-blue-950 disabled:cursor-not-allowed transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <CircleNotch size={20} className="animate-spin" />
              Analyzing...
            </>
          ) : cooldown > 0 ? (
            `Wait ${cooldown}s`
          ) : (
            'Analyze Contract'
          )}
        </button>
      </div>
    </div>
  );
}