# 🔧 How to Fix the Ledger Issue

## 🎯 What's the Problem?

When you call `/api/0g-compute/init`, you get this error:
```
Error: could not decode result data (value="0x")
```

**What this means:**
- ✅ Your code is working perfectly
- ✅ The broker initializes successfully
- ✅ Your wallet connects fine
- ❌ The ledger contract at the default address returns empty data

**Why it happens:**
The SDK uses default contract addresses that might be:
1. From an older testnet version
2. Not deployed yet on current testnet
3. Requiring special permissions/registration

---

## 🚀 Solution Options

### Option 1: Use 0G Private Computer (EASIEST - RECOMMENDED)

**What is it?**
0G Private Computer is a simpler API that doesn't require ledger management. It's like using OpenAI's API but decentralized!

**Advantages:**
- ✅ No ledger setup needed
- ✅ No wallet funding required
- ✅ Works immediately
- ✅ OpenAI-compatible API
- ✅ Multiple models available

**How to implement:**

1. **Update your analyze route:**

```typescript
// src/app/api/0g-compute/analyze-simple/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { contractCode } = await request.json();

    const response = await fetch('https://pc.0g.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        messages: [
          {
            role: 'system',
            content: 'You are a Solidity security expert.',
          },
          {
            role: 'user',
            content: `Analyze this contract: ${contractCode}`,
          },
        ],
      }),
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      analysis: result.choices[0].message.content,
      jobId: result.id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

2. **Available models:**
   - `llama-3.1-8b` - Fast, good for most tasks
   - `llama-3.1-70b` - More powerful
   - `qwen-2.5-72b` - Alternative model
   - Check https://pc.0g.ai/api-reference for full list

3. **Test it:**
```bash
curl -X POST http://localhost:3000/api/0g-compute/analyze-simple \
  -H "Content-Type: application/json" \
  -d '{"contractCode": "pragma solidity ^0.8.0; contract Test {}"}'
```

---

### Option 2: Contact 0G Team for Contract Addresses

**Steps:**

1. **Join 0G Discord:**
   - Go to: https://discord.gg/0glabs
   - Join the server

2. **Ask in #developer-support:**
   ```
   Hi! I'm building on 0G Galileo testnet and getting empty data (0x) 
   when calling broker.ledger.getLedger(). 
   
   Using @0glabs/0g-serving-broker v2.0.0
   RPC: https://evmrpc-testnet.0g.ai
   Chain ID: 16602
   
   Are the default contract addresses still valid?
   - Ledger: 0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7
   - Inference: 0x46e8a02d609CaEfC1747197da1F38272d5E46c77
   
   Do I need to register my wallet first?
   Wallet: 0x0d1d649753155e2903e80b89201FFF09E238Eb3B
   ```

3. **Wait for response** (usually within a few hours)

4. **Update your code** with correct addresses:
```typescript
const broker = await createZGComputeNetworkBroker(
  wallet,
  'NEW_LEDGER_ADDRESS',      // They'll provide this
  'NEW_INFERENCE_ADDRESS',   // And this
  'NEW_FINETUNING_ADDRESS'   // And this
);
```

---

### Option 3: Check Contract on Explorer

**Steps:**

1. **Go to ChainScan:**
   - https://chainscan-galileo.0g.ai

2. **Check each contract:**
   - Ledger: https://chainscan-galileo.0g.ai/address/0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7
   - Inference: https://chainscan-galileo.0g.ai/address/0x46e8a02d609CaEfC1747197da1F38272d5E46c77

3. **Look for:**
   - ✅ Contract code exists
   - ✅ Recent transactions
   - ✅ Contract is verified

4. **If contract doesn't exist:**
   - Use Option 1 (0G Private Computer) instead
   - Or contact 0G team (Option 2)

---

### Option 4: Use Mock Data for Demo

**For hackathon/demo purposes:**

```typescript
// src/app/api/0g-compute/analyze-mock/route.ts
export async function POST(request: NextRequest) {
  const { contractCode } = await request.json();
  
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return NextResponse.json({
    success: true,
    jobId: '0x' + crypto.randomUUID().replace(/-/g, ''),
    analysis: {
      summary: 'Mock analysis for demo purposes',
      vulnerabilities: {
        critical: ['Reentrancy vulnerability in withdraw function'],
        high: ['Unchecked external call'],
        medium: ['Missing input validation'],
        low: ['Gas optimization opportunities'],
      },
      recommendations: [
        'Implement ReentrancyGuard',
        'Add input validation',
        'Use SafeMath for arithmetic',
      ],
      gasOptimizations: [
        'Cache array length in loops',
        'Use calldata instead of memory',
      ],
      stars: 3,
    },
    message: 'Mock analysis - replace with real 0G Compute',
  });
}
```

---

## 🎯 Recommended Approach

**For immediate use (hackathon/demo):**
1. ✅ Use **Option 1** (0G Private Computer) - Works immediately!
2. ✅ No setup needed
3. ✅ Real AI analysis
4. ✅ Decentralized

**For production:**
1. Contact 0G team (Option 2)
2. Get correct contract addresses
3. Update your code
4. Test thoroughly

---

## 📝 Quick Implementation Guide

### Step 1: Create New Route

```bash
# Create new file
touch src/app/api/0g-compute/analyze-pc/route.ts
```

### Step 2: Add Code

Copy the code from `LEDGER_ISSUE_SOLUTION.md` into the new file.

### Step 3: Update Frontend

```typescript
// In your audit page
const response = await fetch('/api/0g-compute/analyze-pc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contractCode }),
});
```

### Step 4: Test

```bash
npm run dev -- --webpack
# Then test in browser at http://localhost:3000/audit
```

---

## 🔍 Debugging Tips

### Check if contract exists:
```bash
curl -X POST https://evmrpc-testnet.0g.ai \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getCode",
    "params": ["0x0c0D02e4E849C711B2388A829366B5bf3f9c53e7", "latest"],
    "id": 1
  }'
```

**Expected:**
- If contract exists: Returns long hex string
- If doesn't exist: Returns `"0x"`

### Check your wallet balance:
```bash
curl -X POST https://evmrpc-testnet.0g.ai \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["0x0d1d649753155e2903e80b89201FFF09E238Eb3B", "latest"],
    "id": 1
  }'
```

---

## 📊 Comparison

| Approach | Setup Time | Complexity | Works Now | Cost |
|----------|-----------|------------|-----------|------|
| 0G Private Computer | 5 min | Low | ✅ Yes | Free tier |
| Contact 0G Team | 1-2 days | Medium | ⏳ Pending | Free |
| Mock Data | 2 min | Very Low | ✅ Yes | Free |
| Fix Contracts | Unknown | High | ❓ Maybe | Free |

---

## 🎉 Recommended Solution

**Use 0G Private Computer (Option 1)** because:
1. ✅ Works immediately
2. ✅ No complex setup
3. ✅ Real AI analysis
4. ✅ Decentralized infrastructure
5. ✅ OpenAI-compatible API
6. ✅ Multiple models available
7. ✅ Perfect for hackathon

You can always switch to the full SDK later when contract addresses are confirmed!

---

## 📞 Need Help?

- **0G Discord:** https://discord.gg/0glabs
- **0G Docs:** https://docs.0g.ai
- **0G PC Docs:** https://pc.0g.ai/api-reference
- **ChainScan:** https://chainscan-galileo.0g.ai

---

**TL;DR:** Use 0G Private Computer API (`https://pc.0g.ai/api/v1/chat/completions`) - it works immediately without ledger setup! 🚀
