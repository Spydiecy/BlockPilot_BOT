# 0G Storage & Compute Integration Guide

This guide explains how to complete the integration of 0G Storage and 0G Compute into BlockPilot.

## Current Status

✅ Contract address updated: `0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0`  
✅ New contract ABI integrated with all required fields  
✅ Frontend code updated to capture and pass new parameters  
✅ API endpoints created (placeholder implementations)  
⏳ SDK integrations needed (next steps below)  

## 0G Storage Integration

### What It Does
- Stores full audit reports in decentralized 0G Storage
- Returns a Merkle root hash (bytes32) for on-chain verification
- Reports are immutable and permanently available

### Files Involved
- `src/utils/zeroGStorage.ts` - Frontend utility functions
- `src/app/api/0g-storage/upload/route.ts` - Backend upload endpoint
- `src/app/api/0g-storage/download/route.ts` - Backend download endpoint

### Setup Steps

#### Option 1: Backend Service (Recommended)

1. **Create a Node.js backend service** (separate from Next.js app):
   ```bash
   # Option A: Create a dedicated service in your project
   mkdir -p services/0g-storage-service
   cd services/0g-storage-service
   npm init -y
   
   # Option B: Or use a Python/Go backend with 0G SDKs
   ```

2. **Install 0G Storage SDK** (Choose one):
   ```bash
   # Go SDK (recommended for performance)
   go get github.com/0gfoundation/0g-storage-client
   
   # TypeScript SDK (Node.js)
   npm install @0gfoundation/0g-storage-client
   ```

3. **Implement Upload Function**:
   ```typescript
   // Backend example with TypeScript SDK
   import { Client } from '@0gfoundation/0g-storage-client';
   
   export async function uploadReport(content: string): Promise<string> {
     const client = new Client({
       evmRpc: 'https://evmrpc-testnet.0g.ai',
       indRpc: 'https://indexer-testnet.0g.ai',
     });
     
     const fileBuffer = Buffer.from(content);
     const result = await client.upload(fileBuffer);
     return result.merkleRoot; // bytes32 hash
   }
   ```

4. **Update Next.js API Route**:
   ```typescript
   // src/app/api/0g-storage/upload/route.ts
   const response = await fetch('http://your-backend:3001/storage/upload', {
     method: 'POST',
     body: JSON.stringify({ content })
   });
   ```

#### Option 2: Use Browser SDK (Not Recommended for Large Files)
```typescript
// For testnet, you might use a lighter approach
import { ZeroGStorageClient } from '@0gfoundation/0g-storage-client';

const client = new ZeroGStorageClient({
  chainRpc: 'https://evmrpc-testnet.0g.ai',
  nodeUrl: 'https://storage-node-testnet.0g.ai'
});

const hash = await client.upload(reportData);
```

### Testing

```bash
# 1. Test upload endpoint
curl -X POST http://localhost:3000/api/0g-storage/upload \
  -H "Content-Type: application/json" \
  -d '{"content":"test audit report"}'

# Expected response:
# {"reportHash":"0x...", "timestamp": ...}

# 2. Test with audit
# Run an audit and check the DevTools Network tab
```

## 0G Compute Integration

### What It Does
- Submits AI analysis requests to 0G Compute Network
- Returns a job ID (bytes32) proving the analysis execution
- Results are verifiable and tied to specific compute nodes

### Files Involved
- `src/utils/zeroGCompute.ts` - Frontend utility functions
- `src/app/api/0g-compute/analyze/route.ts` - Analysis submission
- `src/app/api/0g-compute/status/route.ts` - Job status check

### Current Approach: Keep Mistral, Add Job ID

For now, we're keeping Mistral as the AI engine but routing through 0G Compute to get a verifiable job ID:

```typescript
// Backend: Run analysis with Mistral, submit to 0G Compute
const mistralResult = await mistral.analyze(code);

// Then submit to 0G Compute for a job ID
const computeJobId = await submitTo0GCompute(mistralResult);

return { analysis: mistralResult, jobId: computeJobId };
```

### Future: Replace with 0G Compute Models

When you want to use 0G Compute's native AI models:

1. **Install SDK**:
   ```bash
   npm install @0gfoundation/0g-compute-ts-sdk
   ```

2. **Implement Analysis**:
   ```typescript
   import { Broker } from '@0gfoundation/0g-compute-ts-sdk';
   
   const broker = new Broker({
     chain: {
       rpc: 'https://evmrpc-testnet.0g.ai',
       chainId: 16602,
     },
   });
   
   const result = await broker.inference.chat({
     service: 'mistral-7b', // or other available model
     messages: [{
       role: 'user',
       content: `Audit this: ${contractCode}`
     }]
   });
   
   // result.jobId is your bytes32 proof-of-execution
   ```

3. **Available Services** (check at runtime):
   ```typescript
   const services = await broker.inference.listService();
   // Returns available models and their pricing
   ```

### Setup Steps

#### Option 1: Use Router API (Recommended)

```typescript
// Backend: Use 0G Compute Router for simpler API
const apiKey = process.env.ZERO_G_COMPUTE_API_KEY;

const response = await fetch('https://compute-router.0g.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'mistral-7b',
    messages: [{
      role: 'user',
      content: `Audit: ${contractCode}`
    }]
  })
});

const data = await response.json();
const jobId = data.x_0g_job_id; // Proof-of-execution ID
```

#### Option 2: Use Direct SDK

```typescript
import { Broker } from '@0gfoundation/0g-compute-ts-sdk';

const broker = new Broker({
  chain: {
    rpc: 'https://evmrpc-testnet.0g.ai',
    chainId: 16602
  },
  wallet: privateKey // Your wallet key
});

const result = await broker.inference.chat({
  service: 'model_id_from_listing',
  messages: [/* ... */]
});

const jobId = result.id; // bytes32 proof
```

## Testing the Full Integration

### 1. Test Locally

```bash
# Start your app
npm run dev

# Open http://localhost:3000/audit
# 1. Paste sample contract code
# 2. Click "Analyze"
# 3. Check DevTools Console for:
#    - "Uploading to 0G Storage..."
#    - "Submitting to 0G Compute..."
# 4. Verify the report object has:
#    - reportHash (from storage)
#    - computeJobId (from compute)
```

### 2. Test Contract Registration

```typescript
// In browser console, after audit:
// Assuming you have a connected wallet on 0G testnet

// The registerAuditOnChain function will be called
// It sends:
// - contractHash (code hash)
// - stars (rating)
// - criticalIssues (count)
// - highIssues (count)
// - mediumIssues (count)
// - reportHash (from 0G Storage)
// - summaryPreview (first 100 chars)
// - computeJobId (from 0G Compute)

// View transaction on ChainScan:
// https://chainscan-galileo.0g.ai/tx/{txHash}
```

## Configuration

### Environment Variables

```bash
# .env.local

# 0G Chain RPC
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc-testnet.0g.ai

# 0G Indexer (for storage operations)
NEXT_PUBLIC_0G_INDEXER_URL=https://indexer-testnet.0g.ai

# 0G Compute Router (if using Router approach)
0G_COMPUTE_API_KEY=your-api-key

# Existing Mistral API key (for now)
NEXT_PUBLIC_MISTRAL_API_KEY=your-mistral-key
```

### Contract Configuration

Update these as needed:
- Contract address: `src/utils/contracts.ts`
- Chain config: `src/config/wallet.ts`
- Storage/Compute endpoints: `src/utils/zeroGStorage.ts`, `src/utils/zeroGCompute.ts`

## Deployment Checklist

- [ ] Install and test 0G Storage SDK locally
- [ ] Implement upload/download in backend API routes
- [ ] Install and test 0G Compute SDK
- [ ] Implement compute job submission
- [ ] Set environment variables in deployment platform
- [ ] Test full audit → storage → compute → contract flow
- [ ] Verify reports appear in `/reports` page
- [ ] Verify contract registrations on ChainScan

## Troubleshooting

### Storage Upload Fails
- Check 0G network RPC endpoint is accessible
- Verify wallet has 0G tokens for transaction fees
- Check logs: `console.error('Error uploading to 0G Storage')`

### Compute Job Fails
- Verify 0G Compute network is operational
- Check API key/authentication
- Verify contract code is valid Solidity
- Check rate limits (30 req/min per user)

### Contract Registration Fails
- Ensure wallet is connected to 0G Galileo Testnet (Chain ID: 16602)
- Verify contract address is correct
- Check wallet has enough 0G tokens for gas
- Verify all parameters are bytes32 format

## Resources

- **0G Documentation**: https://docs.0g.ai
- **0G Storage SDK**: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- **0G Compute**: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference
- **ChainScan Explorer**: https://chainscan-galileo.0g.ai
- **Contract Address**: `0x5bA4CB3929C75DF47B8b5E6ca6c7414a5E1a3DB0`

## Next Steps

1. **Week 1**: Install SDKs, implement storage upload
2. **Week 2**: Test storage with sample data
3. **Week 3**: Implement compute job submission  
4. **Week 4**: Full integration testing
5. **Week 5**: Mainnet planning (after hackathon)

Good luck! 🚀
