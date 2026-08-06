# 🛡️ BlockPilot

**AI-Powered Smart Contract Security for 0G Network**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-blockpilot.netlify.app-blue?style=for-the-badge)](https://blockpilot.netlify.app/)
[![0G Network](https://img.shields.io/badge/⛓️_Built_on-0G_Network-brightgreen?style=for-the-badge)](https://0g.ai/)
[![MIT License](https://img.shields.io/badge/📄_License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## What is BlockPilot?

BlockPilot is a comprehensive security platform that makes smart contract auditing instant and accessible. Instead of waiting weeks and paying thousands for traditional audits, developers get enterprise-grade security analysis in seconds using AI—completely free.

Built exclusively for 0G Network, BlockPilot combines Mistral AI's language models with 0G's decentralized storage to create a complete security workflow: audit, store, verify, and document your contracts all in one place.

---

## Features

### 🔍 AI Security Auditor

Paste your contract code and get instant security analysis. The AI scans for vulnerabilities, classifies them by severity (Critical, High, Medium, Low), and provides actionable recommendations. Each audit includes:

- Detailed vulnerability breakdown with explanations
- Gas optimization suggestions to reduce costs
- Security score (1-5 stars) with deployment guidance
- Professional PDF reports you can share with your team

All audit reports are automatically stored on 0G Storage and registered on-chain for permanent verification.

### 🏗️ Smart Contract Builder

Deploy production-ready contracts without writing code. Choose from battle-tested templates:

- **ERC20 Token** - Simple, secure token with mint/burn/pause functionality
- **NFT Collection** - ERC721 with configurable supply and metadata

Each template is self-contained (no external dependencies) and designed to score 4-5 stars on security audits. Enable "Auto-Audit" to get your contract analyzed immediately after deployment.

### 📊 Decentralized Reports

Every audit report is stored on 0G Storage with cryptographic verification. Reports are permanent, tamper-proof, and retrievable by hash. The on-chain registry at `0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0` maintains an immutable record of all audits.

View your complete audit history in the Reports dashboard, with direct links to 0G ChainScan for verification.

### 📝 Documentation Generator

Generate professional documentation for any smart contract. The AI analyzes your code and creates comprehensive docs including:

- All functions with parameters and descriptions
- Events and state variables
- Purpose-tailored content (team docs, client presentations, security audits)
- Technical level adjustment (beginner to advanced explanations)

Export as professional PDF with BlockPilot branding or Markdown for version control.

### 🧪 Test Case Generator

Get complete test suites for your contracts in seconds. Choose your framework:

- **Hardhat** - JavaScript/TypeScript tests with Chai assertions
- **Foundry** - Solidity-native tests with fuzzing support
- **Remix** - Step-by-step manual testing instructions

The AI generates comprehensive tests covering all functions, edge cases, and access control.

### 🎨 Modern Interface

Clean, intuitive design with light and dark themes. The unique hanging bulb toggle adds a playful touch while keeping the interface professional. Everything is responsive and works beautifully on any device.

---

## Technology

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion

**AI:** Mistral AI (mistral-large-latest model)

**Blockchain:** ethers.js v6, 0G Galileo Testnet (Chain ID: 16602)

**Storage:** 0G Storage with Merkle root verification

**Smart Contracts:** Solidity 0.8.19, custom audit registry

---

## 0G Network Integration

BlockPilot is built from the ground up for 0G Network:

**0G Galileo Testnet** - All contracts deploy to 0G's testnet with optimized gas patterns

**0G Storage** - Audit reports stored decentralized with cryptographic verification

**0G Compute** - Foundation ready for distributed AI analysis (partial integration)

**On-Chain Registry** - Immutable audit records at `0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0`

**ChainScan Integration** - Direct links to 0G's block explorer for transparency

Network details:
- RPC: `https://evmrpc-testnet.0g.ai`
- Explorer: `https://chainscan-galileo.0g.ai`
- Chain ID: 16602 (0x40BA)

---

## Security Ratings

| Stars | What It Means |
|:---:|:---|
| ⭐⭐⭐⭐⭐ | Perfect - Zero vulnerabilities, ready to deploy |
| ⭐⭐⭐⭐ | Excellent - Minor optimizations suggested, safe to deploy |
| ⭐⭐⭐ | Good - Some issues found, fix before deploying |
| ⭐⭐ | Risky - Critical vulnerabilities detected, do not deploy |
| ⭐ | Dangerous - Major security flaws, needs complete rewrite |

---

## Why BlockPilot?

**Speed** - Get security audits in 30 seconds instead of waiting weeks

**Cost** - Free AI analysis vs thousands in traditional audit fees

**Decentralized** - Reports stored on 0G Storage, not centralized servers

**Verified** - On-chain registry provides immutable proof of audits

**Complete** - Security, documentation, and testing in one platform

**Developer-Friendly** - Clean interface, instant feedback, professional exports

---

## Live Demo

Try BlockPilot now: **[blockpilot.netlify.app](https://blockpilot.netlify.app/)**

Connect your wallet to 0G Galileo Testnet and start auditing contracts instantly.

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

*Built with ❤️ for the 0G community*
