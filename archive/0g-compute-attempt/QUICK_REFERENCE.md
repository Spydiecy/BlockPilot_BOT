# BlockPilot - Quick Reference Guide

## 🚀 Quick Start

### Start Development Server
```bash
npm run dev -- --webpack
```

### Build for Production
```bash
npm run build -- --webpack
```

### Test API Endpoints
```bash
# Init ledger
curl -X POST http://localhost:3000/api/0g-compute/init

# Analyze contract
curl -X POST http://localhost:3000/api/0g-compute/analyze \
  -H "Content-Type: application/json" \
  -d '{"contractCode": "pragma solidity ^0.8.0; contract Test {}"}'

# Check status
curl -X POST http://localhost:3000/api/0g-compute/status \
  -H "Content-Type: application/json" \
  -d '{"jobId": "0x..."}'
```

---

## 📁 Project Structure

```
BlockPilot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── 0g-compute/
│   │   │   │   ├── init/route.ts          ✅ Initialize ledger
│   │   │   │   ├── analyze/route.ts       ✅ AI analysis
│   │   │   │   ├── status/route.ts        ✅ Job status
│   │   │   │   └── init-account/route.ts  ✅ Account setup
│   │   │   └── 0g-storage/
│   │   │       ├── upload/route.ts        ✅ Store reports
│   │   │       └── download/route.ts      ✅ Retrieve reports
│   │   ├── audit/page.tsx                 📄 Audit UI
│   │   ├── reports/page.tsx               📄 Reports UI
│   │   └── ...
│   ├── lib/
│   │   └── storage.ts                     🔧 Shared storage
│   └── ...
├── .env.local                             🔐 Environment vars
├── next.config.ts                         ⚙️ Next.js config
├── tsconfig.json                          ⚙️ TypeScript config
└── package.json                           📦 Dependencies
```

---

## 🔧 Configuration Files

### .env.local
```bash
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_PRIVATE_KEY=your_private_key_here
```

### next.config.ts
```typescript
{
  webpack: (config, { isServer }) => {
    // External packages for server
    if (isServer) {
      config.externals.push({
        'circomlibjs': 'commonjs circomlibjs',
        'crypto-js': 'commonjs crypto-js',
      });
    }
    return config;
  },
  serverExternalPackages: ['@0glabs/0g-serving-broker'],
}
```

---

## 🔑 Key Code Patterns

### Import 0G SDK (Server-Side)
```typescript
const createBroker = async (wallet: ethers.Wallet) => {
  // @ts-ignore - Using require for CommonJS compatibility
  const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
  return createZGComputeNetworkBroker(wallet);
};
```

### Initialize Broker
```typescript
const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
const wallet = new ethers.Wallet(process.env.OG_PRIVATE_KEY, provider);
const broker = await createBroker(wallet);
```

### Create Ledger
```typescript
await broker.ledger.addLedger(5); // 5 OG tokens
```

### Get Service Metadata
```typescript
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
```

### Get Request Headers
```typescript
const headers = await broker.inference.getRequestHeaders(providerAddress, content);
```

### Process Response
```typescript
await broker.inference.processResponse(providerAddress, result, content);
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Use webpack explicitly
npm run build -- --webpack

# Clear cache
rm -rf .next node_modules/.cache
npm install
```

### Import Errors
```typescript
// ❌ Don't use ESM import
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

// ✅ Use CommonJS require
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
```

### Type Errors
```bash
# Remove conflicting type declarations
rm src/types/0g-serving-broker.d.ts

# Let package use its own types
```

### Ledger Contract Errors
```typescript
// Check if ledger exists first
try {
  const ledger = await broker.ledger.getLedger();
  console.log('Ledger exists:', ledger);
} catch (error) {
  console.log('No ledger, creating one...');
  await broker.ledger.addLedger(5);
}
```

---

## 📊 API Endpoints

### POST /api/0g-compute/init
**Purpose:** Initialize ledger account  
**Body:** None  
**Response:**
```json
{
  "success": true,
  "walletAddress": "0x...",
  "walletBalance": "1.5",
  "ledgerBalance": "5.0"
}
```

### POST /api/0g-compute/analyze
**Purpose:** Analyze smart contract  
**Body:**
```json
{
  "contractCode": "pragma solidity ^0.8.0; ...",
  "providerAddress": "0x..." // optional
}
```
**Response:**
```json
{
  "success": true,
  "jobId": "0x...",
  "analysis": {
    "summary": "...",
    "vulnerabilities": {...},
    "recommendations": [...]
  }
}
```

### POST /api/0g-compute/status
**Purpose:** Check job status  
**Body:**
```json
{
  "jobId": "0x..."
}
```
**Response:**
```json
{
  "success": true,
  "status": "completed",
  "result": {...}
}
```

### POST /api/0g-storage/upload
**Purpose:** Store audit report  
**Body:**
```json
{
  "content": "{...report JSON...}"
}
```
**Response:**
```json
{
  "success": true,
  "reportHash": "0x...",
  "timestamp": 1234567890
}
```

### POST /api/0g-storage/download
**Purpose:** Retrieve audit report  
**Body:**
```json
{
  "reportHash": "0x..."
}
```
**Response:**
```json
{
  "success": true,
  "report": {...},
  "timestamp": 1234567890
}
```

---

## 🔗 Important Links

### 0G Network
- **Docs:** https://docs.0g.ai
- **Discord:** https://discord.gg/0glabs
- **GitHub:** https://github.com/0glabs/0g-serving-user-broker
- **Explorer:** https://chainscan-galileo.0g.ai
- **Faucet:** https://faucet.0g.ai

### Contract Addresses
- **Audit Registry:** 0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0
- **Ledger:** 0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7
- **Inference:** 0x46e8a02d609CaEfC1747197da1F38272d5E46c77

### Network Info
- **RPC:** https://evmrpc-testnet.0g.ai
- **Chain ID:** 16602
- **Currency:** OG

---

## 📝 Common Tasks

### Add New API Route
1. Create file in `src/app/api/[route]/route.ts`
2. Export POST/GET/PUT/DELETE functions
3. Don't export other functions (use shared modules)

### Update Environment Variables
1. Edit `.env.local`
2. Restart development server
3. Variables available as `process.env.VAR_NAME`

### Test Locally
```bash
# Start server
npm run dev -- --webpack

# In another terminal
curl -X POST http://localhost:3000/api/...
```

### Deploy
```bash
# Build
npm run build -- --webpack

# Deploy to Vercel/Netlify/etc
# Make sure to set environment variables in deployment platform
```

---

## ✅ Checklist

### Before Committing
- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] Environment variables documented
- [ ] API routes tested
- [ ] Documentation updated

### Before Deploying
- [ ] Production build successful
- [ ] Environment variables set
- [ ] Contract addresses verified
- [ ] Wallet funded
- [ ] Test on staging first

### For Demo
- [ ] Server running
- [ ] Wallet has testnet tokens
- [ ] Sample contracts ready
- [ ] UI/UX polished
- [ ] Error handling in place

---

## 🎯 Quick Fixes

### "Module not found"
```bash
npm install
npm run build -- --webpack
```

### "createZGComputeNetworkBroker is undefined"
```typescript
// Use require() not import
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
```

### "Route export not valid"
```typescript
// Only export GET, POST, PUT, DELETE
export async function POST(request: NextRequest) { ... }

// Don't export other functions
// Use shared modules instead
```

### "Ledger not found"
```typescript
// Create ledger first
await broker.ledger.addLedger(5);
```

---

**Last Updated:** May 12, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
