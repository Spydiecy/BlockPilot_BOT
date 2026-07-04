'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFileText, FiX, FiCode } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface FileUploadAreaProps {
  onFileUpload: (content: string, fileName: string) => void;
  isLoading?: boolean;
  currentFile?: string | null;
}

export function FileUploadArea({ onFileUpload, isLoading, currentFile }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setError('File size should be less than 1MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content, file.name);
      };
      reader.onerror = () => setError('Error reading file');
      reader.readAsText(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sol', '.txt'],
      'text/x-solidity': ['.sol']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 hover:border-blue-500/50 bg-gray-900/50 hover:bg-gray-900/70'
        }`}
      >
        <input {...getInputProps()} disabled={isLoading} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-blue-500/10">
              <FiUpload className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          {currentFile ? (
            <div className="mt-2">
              <div className="flex items-center justify-center space-x-2">
                <FiFileText className="text-blue-400" />
                <span className="text-sm font-medium text-gray-300">{currentFile}</span>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileUpload('', '');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Click to change file or drag and drop a new one
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-medium text-white">
                  {isDragActive ? 'Drop your Solidity file here' : 'Drag & drop your Solidity file'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  or click to browse files (max 1MB)
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <FiCode className="w-4 h-4" />
                <span>Supports .sol and .txt files</span>
              </div>
            </>
          )}
          
          {isLoading && (
            <div className="pt-4">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut' 
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">Analyzing your smart contract...</p>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <motion.div 
          className="mt-4 p-3 text-sm text-red-400 bg-red-500/10 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
