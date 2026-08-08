# 🛡️ BlockPilot

**AI-Powered Smart Contract Security on QIE Testnet**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-blockpilot--0g.vercel.app-blue?style=for-the-badge)](https://blockpilot-0g.vercel.app/)
[![QIE Testnet](https://img.shields.io/badge/⛓️_Built_on-QIE_Testnet-brightgreen?style=for-the-badge)](https://qie.digital/)
[![MIT License](https://img.shields.io/badge/📄_License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## What is BlockPilot?

BlockPilot transforms smart contract security from a weeks-long, expensive process into instant AI-powered analysis. Built for QIE Testnet, it combines Mistral AI's language models with IPFS storage and on-chain verification to create a complete security workflow: audit, store, verify, and document your contracts all in one place.

**The Problem:** Developers deploy vulnerable contracts because traditional audits are slow and costly.

**Our Solution:** Real-time AI security analysis with decentralized report storage and on-chain verification.

---

## Features

### 🔍 AI Security Auditor

Paste your contract code and get instant security analysis. The AI scans for vulnerabilities, classifies them by severity (Critical, High, Medium, Low), and provides actionable recommendations. Each audit includes:

- Detailed vulnerability breakdown with explanations
- Gas optimization suggestions to reduce costs
- Security score (1-5 stars) with deployment guidance
- Professional PDF reports you can share with your team

All audit reports are automatically stored on IPFS via Pinata and registered on-chain for permanent verification.

### 🏗️ Smart Contract Builder

Deploy production-ready contracts without writing code. Choose from battle-tested templates:

- **ERC20 Token** - Simple, secure token with mint/burn/pause functionality
- **NFT Collection** - ERC721 with configurable supply and metadata

Each template is self-contained (no external dependencies) and designed to score 4-5 stars on security audits. Enable "Auto-Audit" to get your contract analyzed immediately after deployment.

### 📊 Decentralized Reports

Every audit report is stored on IPFS via Pinata with content-addressed verification. Reports are permanent, tamper-proof, and retrievable by CID. The on-chain registry at `0xc60E29FDdf01b9E15CDa524B48991B33bFa0E0FD` maintains an immutable record of all audits.

View your complete audit history in the Reports dashboard, with direct links to QIE Testnet explorer for verification.

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

### 🎨 Modern Interface

Clean, intuitive design with light and dark themes. Responsive and accessible on any device.

---

## Technology

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion

**AI:** Mistral AI (mistral-large-latest model)

**Blockchain:** ethers.js v6, QIE Testnet (Chain ID: 1983)

**Storage:** IPFS via Pinata SDK v2.5.6

**Smart Contracts:** Solidity 0.8.19 (paris EVM), custom audit registry

---

## QIE Testnet Integration

BlockPilot is built for QIE Testnet:

**QIE Testnet** - All contracts deploy with optimized gas patterns

**IPFS via Pinata** - Audit reports stored decentralized, retrievable by CID

**On-Chain Registry** - Immutable audit records at `0xc60E29FDdf01b9E15CDa524B48991B33bFa0E0FD`

**Explorer Integration** - Direct links to QIE explorer for transparent verification

Network details:
- RPC: `https://rpc1testnet.qie.digital`
- Explorer: `https://testnet.qie.digital`
- Chain ID: 1983 (0x7bf)

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

**Decentralized** - Reports stored on IPFS, not centralized servers

**Verified** - On-chain registry provides immutable proof of audits

**Complete** - Security, documentation, and testing in one platform

**Clean Storage** - Orphaned IPFS reports auto-deleted if on-chain registration fails

---

## Live Demo

Try BlockPilot now: **[blockpilot-0g.vercel.app](https://blockpilot-0g.vercel.app/)**

Connect your wallet to QIE Testnet and start auditing contracts instantly.

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

*Built with ❤️ for the QIE community*
