'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiZap } from 'react-icons/fi';

interface SeverityItemProps {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface AuditResultCardProps {
  result: {
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
  };
  onRegisterAudit: () => void;
  isRegistering: boolean;
}

const SeverityItem: React.FC<SeverityItemProps> = ({ 
  title, 
  items, 
  icon, 
  color, 
  bgColor, 
  borderColor 
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${bgColor} mb-4`}>
      <div className="flex items-center space-x-2 mb-2">
        <div className={color}>
          {icon}
        </div>
        <h4 className={`font-medium ${color}`}>{title} ({items.length})</h4>
      </div>
      <ul className="space-y-2 pl-6">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-300 list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
export function AuditResultCard({ result, onRegisterAudit, isRegistering }: AuditResultCardProps) {
  const renderStars = () => {
    return Array(5).fill(0).map((_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < result.stars ? 'text-yellow-400' : 'text-gray-700'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-4xl mx-auto mt-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Audit Results</h2>
          <div className="flex items-center space-x-1">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-400">
              {result.stars}/5 Security Score
            </span>
          </div>
        </div>
        <button
          onClick={onRegisterAudit}
          disabled={isRegistering}
          className={`mt-4 md:mt-0 px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
            isRegistering
              ? 'bg-blue-600/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRegistering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <FiZap className="w-4 h-4" />
              <span>Register on Blockchain</span>
            </>
          )}
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-3 flex items-center">
          <FiInfo className="mr-2 text-blue-400" />
          Summary
        </h3>
        <p className="text-gray-300">{result.summary}</p>
      </div>

      {/* Vulnerabilities */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Vulnerabilities Found</h3>
        
        <SeverityItem
          title="Critical Issues"
          items={result.vulnerabilities.critical}
          icon={<FiAlertTriangle className="w-5 h-5" />}
          color="text-red-400"
          bgColor="bg-red-500/10"
          borderColor="border-red-500/20"
        />
        
        <SeverityItem
          title="High Risk"
          items={result.vulnerabilities.high}
          icon={<FiAlertTriangle className="w-5 h-5" />}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
          borderColor="border-orange-500/20"
        />
        
        <SeverityItem
          title="Medium Risk"
          items={result.vulnerabilities.medium}
          icon={<FiAlertTriangle className="w-5 h-5" />}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
          borderColor="border-yellow-500/20"
        />
        
        <SeverityItem
          title="Low Risk"
          items={result.vulnerabilities.low}
          icon={<FiAlertTriangle className="w-5 h-5" />}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
        />
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <FiCheckCircle className="mr-2 text-green-400" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-400 mr-2 mt-1">•</span>
                <span className="text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gas Optimizations */}
      {result.gasOptimizations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-3 flex items-center">
            <FiZap className="mr-2 text-yellow-400" />
            Gas Optimizations
          </h3>
          <ul className="space-y-2">
            {result.gasOptimizations.map((opt, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-yellow-400 mr-2 mt-1">•</span>
                <span className="text-gray-300">{opt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
