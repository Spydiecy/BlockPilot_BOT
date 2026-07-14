'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import {
  IconShieldLock,
  IconBrain,
  IconBolt,
  IconGauge,
  IconCode,
  IconAlertTriangle,
  IconReportAnalytics,
  IconCloudComputing,
  IconFileCode,
  IconRobot,
  IconTestPipe,
  IconCube,
  IconChevronRight,
  IconStar,
  IconStarFilled,
  IconCopy,
  IconExternalLink,
  IconBrandTwitter,
  IconBrandGithub,
  IconBrandDiscord,
  IconBrandTelegram,
} from "@tabler/icons-react";

// Add type definitions
interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Chain {
  id: number;
  name?: string;
  icon?: string;
}

interface Audit {
  id: number;
  contractHash?: string;
  rating?: number;
  summary?: string;
  auditor?: string;
  timestamp?: number;
}

const workflowSteps: Step[] = [
  {
    title: "Submit Contract",
    description: "Upload your Solidity smart contract code to our secure platform for analysis",
    icon: <IconFileCode className="w-8 h-8" />,
  },
  {
    title: "AI Analysis",
    description: "Our Finetuned AI performs comprehensive security analysis and vulnerability detection",
    icon: <IconRobot className="w-8 h-8" />,
  },
  {
    title: "Generate Documentation",
    description: "Automatically generate detailed documentation with best practices and examples",
    icon: <IconReportAnalytics className="w-8 h-8" />,
  },
  {
    title: "Test Suite Creation",
    description: "Get auto-generated test cases covering all critical contract functions",
    icon: <IconTestPipe className="w-8 h-8" />,
  },
  {
    title: "On-Chain Report",
    description: "Receive a detailed audit report that's permanently stored on the blockchain",
    icon: <IconCube className="w-8 h-8" />,
  },
  {
    title: "Contract Verification",
    description: "Get your smart contract verified and ready for deployment",
    icon: <IconShieldLock className="w-8 h-8" />,
  },
];

const supportedChains: Chain[] = [
  { id: 1, name: "BlockDAG Testnet", icon: "/chains/blockdag.png" },
];

const latestAudits: Audit[] = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
];

const HowItWorks = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>
      
      {/* Section Header */}
      <div className="relative text-center mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
          SMART CONTRACT<br />
          <span className="text-blue-400">WORKFLOW</span>
        </h2>
        <div className="text-xs text-gray-400 tracking-wider mb-6">
          SUBMIT · ANALYZE · SECURE · DEPLOY
        </div>
      </div>

      {/* Steps Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800/30">
        {workflowSteps.map((step, index) => (
          <div
            key={step.title}
            className="relative group bg-black"
          >
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="relative p-8 border-neutral-800 group-hover:border-blue-500/20 transition-colors duration-300">
              {/* Step Number */}
              <div className="absolute top-6 right-8 text-7xl font-bold text-neutral-800/20 group-hover:text-blue-500/10 transition-colors duration-300">
                {(index + 1).toString().padStart(2, '0')}
              </div>
              
              {/* Icon */}
              <div className="relative">
                <div className="absolute -inset-1 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-12 w-12 flex items-center justify-center bg-neutral-900 rounded-lg text-blue-400 group-hover:text-blue-300 transition-all duration-300">
                  {step.icon}
                </div>
              </div>
              
              {/* Text Content */}
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">
                  {step.description}
                </p>
              </div>
              
              {/* Left Border Accent */}
              <div className="absolute left-0 top-8 h-8 w-0.5 bg-neutral-800 group-hover:bg-blue-500 group-hover:h-16 transition-all duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChainsSupported = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Section Header */}
      <div className="relative text-center mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
          SUPPORTED<br />
          <span className="text-blue-400">NETWORKS</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Currently supporting BlockDAG Testnet for development and testing
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
          🚀 Mainnet coming soon!
        </div>
      </div>

      {/* Chains Grid */}
      <div className="relative flex justify-center">
        {supportedChains.map((chain) => (
          <div
            key={chain.id}
            className="relative group bg-black/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-black/70 transition-all duration-300 border border-neutral-800/50 hover:border-blue-500/50 max-w-sm"
          >
            {/* Card Background with Gradient */}
            <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 transition-all duration-300 group-hover:border-blue-500/50">
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl" />
            </div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col items-center justify-center text-center">
              {/* BlockDAG Logo */}
              <div className="w-20 h-20 bg-neutral-800 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                {chain.icon ? (
                  <img 
                    src={chain.icon} 
                    alt={chain.name} 
                    className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300 text-xl font-bold">
                    BD
                  </div>
                )}
              </div>

              {/* Network Name */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                {chain.name}
              </h3>
              
              {/* Status Badge */}
              <div className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm mb-4">
                🟢 Live & Active
              </div>
              
              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed">
                Secure smart contract auditing and deployment on BlockDAG's revolutionary network architecture
              </p>
            </div>

            {/* Glowing Effect */}
            <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
          </div>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
          <span className="text-blue-400 font-mono text-sm">MAINNET</span>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm">Coming Q2 2025</span>
        </div>
      </div>
    </div>
  );
};

const AuditCard = ({ audit }: { audit: any }) => {
  return (
    <div className="group relative">
      {/* Card Background */}
      <div className="relative bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 transition-all duration-300 group-hover:border-blue-500/50 p-6">
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl" />
        
        {/* Content */}
        <div className="relative">
          {/* Contract Hash */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="text-sm text-neutral-400">Contract</div>
              <div className="flex items-center space-x-2 bg-neutral-800/50 rounded-lg px-3 py-1">
                <code className="text-sm text-blue-400">0x1234...5678</code>
                <button className="text-neutral-500 hover:text-blue-400 transition-colors">
                  <IconCopy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <a href="#" className="text-neutral-500 hover:text-blue-400 transition-colors">
              <IconExternalLink className="w-5 h-5" />
            </a>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <IconStarFilled key={star} className="w-5 h-5 text-blue-400" />
            ))}
          </div>

          {/* Summary */}
          <p className="text-neutral-300 mb-6">
            No critical vulnerabilities found. Code follows best practices with minor optimizations suggested.
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="text-neutral-400">
                By <span className="text-blue-400">0xAud...itor</span>
              </div>
              <div className="text-neutral-500">2 days ago</div>
            </div>
            <div className="flex items-center text-neutral-400 hover:text-blue-400 transition-colors cursor-pointer">
              View Report
              <IconChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Glowing Effect */}
      <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
    </div>
  );
};

const Audits = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Section Header */}
      <div className="relative text-center mb-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
          RECENT<br />
          <span className="text-blue-400">AUDITS</span>
        </h2>
      </div>

      {/* Audits Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {latestAudits.map((audit) => (
          <div
            key={audit.id}
            className="relative group bg-black/50 backdrop-blur-sm rounded-lg p-6 hover:bg-black/70 transition-all duration-300"
          >
            {/* ... audit rendering ... */}
          </div>
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  const links = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Networks", href: "#chains" },
      { name: "Audits", href: "#audits" },
      { name: "Documentation", href: "#" },
    ],
    company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "License", href: "#" },
    ],
    social: [
      { name: "Twitter", href: "#", icon: IconBrandTwitter },
      { name: "GitHub", href: "#", icon: IconBrandGithub },
      { name: "Discord", href: "#", icon: IconBrandDiscord },
      { name: "Telegram", href: "#", icon: IconBrandTelegram },
    ],
  };

  return (
    <footer className="relative z-10 border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-20">
          {/* Logo and Social */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-4">
              <a href="#" className="group">
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300" />
                  
                  {/* Logo Container */}
                  <div className="relative flex items-center bg-black border border-neutral-800 group-hover:border-blue-500/50 px-4 py-2 rounded-lg transition duration-300">
                    {/* Lightning Bolt */}
                    <div className="mr-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    
                    {/* Text */}
                    <span className="text-xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300 group-hover:from-blue-400 group-hover:to-white transition duration-300">
                      AuditFi
                    </span>
                  </div>
                </div>
              </a>
            </div>
            <div className="flex items-center space-x-6">
              {links.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-neutral-400 hover:text-blue-400 transition-colors duration-300"
                >
                  <item.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {links.product.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {links.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                {links.legal.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Newsletter</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Stay updated with our latest features and releases.
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors duration-300 text-sm"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm">
              © 2025 AuditFi. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                Privacy Policy
              </a>
              <span className="text-neutral-600">·</span>
              <a href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300 text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export function HomeSections() {
  const features = [
    {
      title: "AI-Powered Analysis",
      description:
        "Advanced smart contract analysis powered by Finetuned AI models, providing comprehensive security assessments.",
      icon: <IconBrain className="w-6 h-6" />,
    },
    {
      title: "Documentation Generation",
      description:
        "Gemini-powered automatic documentation generation for Solidity contracts with best practices and examples.",
      icon: <IconReportAnalytics className="w-6 h-6" />,
    },
    {
      title: "Test Suite Generation",
      description:
        "Automated test case generation supporting multiple frameworks to ensure comprehensive contract coverage.",
      icon: <IconCode className="w-6 h-6" />,
    },
    {
      title: "On-Chain Verification",
      description: 
        "All audit reports are permanently stored on the blockchain, ensuring transparency and immutability.",
      icon: <IconShieldLock className="w-6 h-6" />,
    },
    {
      title: "BlockDAG Network Optimized",
      description: 
        "Specialized security coverage and optimization specifically designed for BlockDAG Network architecture.",
      icon: <IconBolt className="w-6 h-6" />,
    },
    {
      title: "Vulnerability Detection",
      description:
        "Real-time detection of security vulnerabilities, with instant alerts for potential threats and issues.",
      icon: <IconAlertTriangle className="w-6 h-6" />,
    },
    {
      title: "Gas Optimization",
      description:
        "Advanced analysis for optimizing gas usage and improving overall contract efficiency.",
      icon: <IconGauge className="w-6 h-6" />,
    },
    {
      title: "Cloud Infrastructure",
      description: 
        "Enterprise-grade infrastructure ensuring reliable and secure contract analysis capabilities.",
      icon: <IconCloudComputing className="w-6 h-6" />,
    },
  ];

  return (
    <section className="relative pt-24 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      <div className="relative z-10">
        {/* Features Header */}
        <div id="features" className="relative text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
            PLATFORM<br />
            <span className="text-blue-400">FEATURES</span>
          </h2>
          <div className="text-xs text-gray-400 tracking-wider mb-6">
            ANALYZE · DOCUMENT · TEST · SECURE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>

        <div id="how-it-works">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                SMART CONTRACT<br />
                <span className="text-blue-400">WORKFLOW</span>
              </h2>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                SUBMIT · ANALYZE · SECURE · DEPLOY
              </div>
            </div>

            {/* Steps Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800/30">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative group bg-black"
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-800/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content */}
                  <div className="relative p-8 border-neutral-800 group-hover:border-blue-500/20 transition-colors duration-300">
                    {/* Step Number */}
                    <div className="absolute top-6 right-8 text-7xl font-bold text-neutral-800/20 group-hover:text-blue-500/10 transition-colors duration-300">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    
                    {/* Icon */}
                    <div className="relative">
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative h-12 w-12 flex items-center justify-center bg-neutral-900 rounded-lg text-blue-400 group-hover:text-blue-300 transition-all duration-300">
                        {step.icon}
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                    
                    {/* Left Border Accent */}
                    <div className="absolute left-0 top-8 h-8 w-0.5 bg-neutral-800 group-hover:bg-blue-500 group-hover:h-16 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="chains">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                NETWORKS<br />
                <span className="text-blue-400">SUPPORTED</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
                Currently supporting BlockDAG Testnet for development and testing
              </p>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                SECURE · SCALABLE · REVOLUTIONARY · RELIABLE
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm">
                🚀 Mainnet coming soon!
              </div>
            </div>

            {/* Chains Grid */}
            <div className="relative flex justify-center">
              {supportedChains.map((chain) => (
                <div
                  key={chain.id}
                  className="group relative bg-black/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-black/70 transition-all duration-300 border border-neutral-800/50 hover:border-blue-500/50 max-w-sm"
                >
                  {/* Card Background with Gradient */}
                  <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800/50 transition-all duration-300 group-hover:border-blue-500/50">
                    {/* Hover Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl" />
                  </div>

                  {/* Content Container */}
                  <div className="relative h-full flex flex-col items-center justify-center text-center">
                    {/* BlockDAG Logo */}
                    <div className="w-20 h-20 bg-neutral-800 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                      {chain.icon ? (
                        <img 
                          src={chain.icon} 
                          alt={chain.name} 
                          className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300 text-xl font-bold">
                          BD
                        </div>
                      )}
                    </div>

                    {/* Network Name */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                      {chain.name}
                    </h3>
                    
                    {/* Status Badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm mb-4">
                      🟢 Live & Active
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Secure smart contract auditing and deployment on BlockDAG's revolutionary network architecture
                    </p>
                  </div>

                  {/* Glowing Effect */}
                  <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              ))}
            </div>

            {/* Coming Soon Section */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                <span className="text-blue-400 font-mono text-sm">MAINNET</span>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 text-sm">Coming Q2 2025</span>
              </div>
            </div>
          </div>
        </div>

        <div id="audits">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.8)_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Section Header */}
            <div className="relative text-center mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold mb-4 leading-tight text-white">
                RECENT<br />
                <span className="text-blue-400">AUDITS</span>
              </h2>
              <div className="text-xs text-gray-400 tracking-wider mb-6">
                VERIFIED · SECURED · DOCUMENTED · OPTIMIZED
              </div>
            </div>

            {/* Audits Grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
              {latestAudits.map((audit) => (
                <AuditCard key={audit.id} audit={audit} />
              ))}
            </div>

            {/* View All Button */}
            <div className="relative mt-16 text-center">
              <a href="#" className="inline-flex items-center justify-center px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full border border-neutral-800 hover:border-blue-500/50 transition-all duration-300 group">
                <span className="mr-2">View All Audits</span>
                <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l border-neutral-800",
        index < 4 && "lg:border-b border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
}; 