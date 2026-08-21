# BlockPilot

**AI-Powered Smart Contract Security on BOT Chain**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Now-blue?style=for-the-badge)](https://blockpilot-bot-opal.vercel.app/)
[![BOT Chain](https://img.shields.io/badge/Built_on-BOT_Chain-brightgreen?style=for-the-badge)](https://scan.botchain.ai/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## What is BlockPilot?

BlockPilot transforms smart contract security from a weeks-long, expensive process into instant AI-powered analysis. Built for BOT Chain, it combines Mistral AI's language models with IPFS storage and on-chain verification to create a complete security workflow: audit, store, verify, and document your contracts all in one place.

**The Problem:** Developers deploy vulnerable contracts because traditional audits are slow and costly.

**Our Solution:** Real-time AI security analysis with decentralized report storage and on-chain verification.

---

## Features

### AI Security Auditor

Paste your contract code and get instant security analysis. The AI scans for vulnerabilities, classifies them by severity (Critical, High, Medium, Low), and provides actionable recommendations. Each audit includes:

- Detailed vulnerability breakdown with explanations
- Gas optimization suggestions to reduce costs
- Security score (1-5 stars) with deployment guidance
- Professional PDF reports you can share with your team

All audit reports are automatically stored on IPFS via Pinata and registered on-chain for permanent verification.

### Mainnet & Testnet Support

BlockPilot now runs on both **BOT Chain Mainnet** and **BOT Chain Testnet**. Switch networks right from the in-app network switcher — your audits, deployments, and reports are automatically tagged and tracked per network.

### Smart Contract Builder

Deploy production-ready contracts without writing code. Choose from battle-tested templates:

- **ERC20 Token** - Simple, secure token with mint/burn/pause functionality
- **NFT Collection** - ERC721 with configurable supply and metadata

Each template is self-contained (no external dependencies) and designed to score 4-5 stars on security audits. Enable "Auto-Audit" to get your contract analyzed immediately after deployment.

### Decentralized Reports

Every audit report is stored on IPFS via Pinata with content-addressed verification. Reports are permanent, tamper-proof, and retrievable by CID. The on-chain registry at `0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6` maintains an immutable record of all audits on both Mainnet and Testnet.

View your complete audit history in the Reports dashboard, with direct links to the BOT Chain explorer for verification.

### Documentation Generator

Generate professional documentation for any smart contract. The AI analyzes your code and creates comprehensive docs including:

- All functions with parameters and descriptions
- Events and state variables
- Purpose-tailored content (team docs, client presentations, security audits)
- Technical level adjustment (beginner to advanced explanations)

Export as professional PDF with BlockPilot branding or Markdown for version control.

### Test Case Generator

Get complete test suites for your contracts in seconds. Choose your framework:

- **Hardhat** - JavaScript/TypeScript tests with Chai assertions
- **Foundry** - Solidity-native tests with fuzzing support
- **Remix** - Step-by-step manual testing instructions

### Modern Interface

Clean, intuitive design with light and dark themes. Responsive and accessible on any device.

---

## Technology

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion

**AI:** Mistral AI (mistral-large-latest model)

**Blockchain:** ethers.js v6, BOT Chain Mainnet (Chain ID: 677) and BOT Chain Testnet (Chain ID: 968)

**Storage:** IPFS via Pinata SDK v2.5.6

**Smart Contracts:** Solidity 0.8.19 (paris EVM), custom audit registry

---

## BOT Chain Integration

BlockPilot is built for BOT Chain and supports both networks:

**Mainnet & Testnet** - All contracts deploy with optimized gas patterns on either network

**IPFS via Pinata** - Audit reports stored decentralized, retrievable by CID

**On-Chain Registry** - Immutable audit records at `0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6`

**Explorer Integration** - Direct links to the BOT Chain explorer for transparent verification

**Network Switcher** - Swap between Mainnet and Testnet directly from the navbar

Network details:

| | BOT Chain Mainnet | BOT Chain Testnet |
|---|---|---|
| RPC | `https://rpc.botchain.ai` | `https://rpc.bohr.life` |
| Explorer | `https://scan.botchain.ai` | `https://scan.bohr.life` |
| Chain ID | 677 | 968 |
| Currency symbol | BOT | tBOT |

---

## Security Ratings

| Stars | What It Means |
|:---:|:---|
| 5 | Perfect - Zero vulnerabilities, ready to deploy |
| 4 | Excellent - Minor optimizations suggested, safe to deploy |
| 3 | Good - Some issues found, fix before deploying |
| 2 | Risky - Critical vulnerabilities detected, do not deploy |
| 1 | Dangerous - Major security flaws, needs complete rewrite |

---

## Why BlockPilot?

**Speed** - Get security audits in 30 seconds instead of waiting weeks

**Cost** - Free AI analysis vs thousands in traditional audit fees

**Decentralized** - Reports stored on IPFS, not centralized servers

**Verified** - On-chain registry provides immutable proof of audits

**Complete** - Security, documentation, and testing in one platform

**Multi-Network** - Full support for both BOT Chain Mainnet and Testnet

**Clean Storage** - Orphaned IPFS reports auto-deleted if on-chain registration fails

---

## Live Demo

Try BlockPilot now: **[blockpilot-bot-opal.vercel.app](https://blockpilot-bot-opal.vercel.app/)**

Connect your wallet, pick Mainnet or Testnet from the network switcher, and start auditing contracts instantly.

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

*Built with care for the BOT Chain community*
