# 🚀 Quick Start - Testing 0G Integration

## 1️⃣ Setup (5 minutes)

```bash
# Clone and navigate to project
cd /Users/spydiecy/Documents/Projects/BlockPilot

# Create environment file
cat > .env.local << EOF
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_PRIVATE_KEY=your_private_key_here
EOF

# Get a test wallet private key
# - Option A: Use MetaMask (Settings → Security & Privacy → Show Private Key)
# - Option B: Use existing wallet
# - Option C: Get from .env if already configured
```

## 2️⃣ Get Testnet Tokens (1-2 minutes)

```bash
# Visit the faucet
open https://faucet.0g.ai

# Or use Discord
# https://discord.gg/0glabs → #faucet
```

## 3️⃣ Start Development Server

```bash
npm run dev
```

Expected output:
```
> blockpilot@0.1.0 dev
> next dev
...
▲ Next.js 16.1.6 (local)
...
✓ Ready in 1234ms
```

## 4️⃣ Test the APIs

### Test 1: Compute Endpoint

```bash
# In a new terminal
curl -X POST http://localhost:3000/api/0g-compute/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "contractCode": "pragma solidity ^0.8.0;\n\ncontract SimpleToken {\n    mapping(address => uint256) public balances;\n    \n    function transfer(address to, uint256 amount) public {\n        require(balances[msg.sender] >= amount, \"Insufficient balance\");\n        balances[msg.sender] -= amount;\n        balances[to] += amount;\n    }\n}"
  }' | jq .
```

Expected response:
```json
{
  "success": true,
  "jobId": "0x...",
  "provider": "0x...",
  "model": "gpt-3.5-turbo",
  "analysis": {
    "summary": "...",
    "vulnerabilities": {
      "critical": [...],
      "high": [...],
      "medium": [...],
      "low": [...]
    },
    "recommendations": [...],
    "gasOptimizations": [...],
    "stars": 3
  }
}
```

### Test 2: Storage Upload

```bash
curl -X POST http://localhost:3000/api/0g-storage/upload \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{\"analysis\": {\"summary\": \"Test contract\", \"vulnerabilities\": {\"critical\": [], \"high\": [], \"medium\": [], \"low\": []}}}"
  }' | jq .
```

Expected response:
```json
{
  "success": true,
  "reportHash": "0x...",
  "timestamp": 1234567890,
  "size": 123
}
```

Save the `reportHash` for the next test.

### Test 3: Storage Download

```bash
# Use the reportHash from Test 2
curl -X POST http://localhost:3000/api/0g-storage/download \
  -H "Content-Type: application/json" \
  -d '{
    "reportHash": "0x..."
  }' | jq .
```

### Test 4: Job Status

```bash
# Use jobId from Test 1
curl -X POST http://localhost:3000/api/0g-compute/status \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "0x..."
  }' | jq .
```

## 5️⃣ Full End-to-End Test

### Browser Testing

1. Open http://localhost:3000
2. Navigate to **Audit** page
3. Paste a Solidity contract:

```solidity
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    // VULNERABILITY: Reentrancy issue
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        balances[msg.sender] -= amount;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
}
```

4. Click **"Analyze"** button
5. Wait for analysis (5-15 seconds)
6. View results:
   - Issue counts
   - Vulnerability list
   - Recommendations
   - Gas optimizations
   - Security rating

7. Click **"Register on-chain"** button
8. Confirm transaction in MetaMask
9. Wait for confirmation (~30 seconds)
10. View on **Reports** page

## 📊 Expected Test Results

### Compute Analysis
- ✅ Returns jobId (32-byte hex string)
- ✅ Identifies vulnerabilities (if any)
- ✅ Provides security rating (0-5 stars)
- ✅ Suggests gas optimizations
- ✅ Includes recommendations

### Storage
- ✅ Generates consistent hash for same content
- ✅ Stores and retrieves successfully
- ✅ Verifies hash on download

### On-Chain
- ✅ Transaction confirmed on ChainScan
- ✅ All fields visible on explorer
- ✅ Reports page shows audit

## 🔍 Debugging

### Check Logs in Browser Console

```javascript
// In browser DevTools Console (F12)
// Look for:
// - POST /api/0g-compute/analyze
// - POST /api/0g-storage/upload
// - registerAudit() transaction
```

### Check Server Logs

```bash
# Terminal running 'npm run dev'
# Look for:
// - [0G Compute] calls
// - [Storage] hash: 0x...
// - [Contract] registerAudit execution
```

### Test with cURL (Verbose)

```bash
curl -v -X POST http://localhost:3000/api/0g-compute/analyze \
  -H "Content-Type: application/json" \
  -d '{"contractCode":"pragma solidity ^0.8.0; contract Test {}"}' 2>&1 | less
```

## ⚠️ Common Issues & Fixes

### "OG_PRIVATE_KEY environment variable not set"
```bash
# Make sure .env.local exists with valid key
cat .env.local  # Should show OG_PRIVATE_KEY=0x...
```

### "No providers available"
```bash
# Wallet doesn't have 0G tokens
# Solution: Get tokens from faucet
# https://faucet.0g.ai
```

### Build fails
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm run dev
```

## 📈 Next Steps

After successful testing:

1. ✅ Test with various contract types
2. ✅ Verify gas estimates
3. ✅ Test error cases
4. ✅ Load test with multiple audits
5. ⏳ Deploy to staging
6. ⏳ Get user feedback
7. ⏳ Post-hackathon: mainnet setup

## 📚 Documentation

| File | Purpose |
|------|---------|
| [SDK_INTEGRATION.md](SDK_INTEGRATION.md) | Technical SDK details |
| [ENV_SETUP.md](ENV_SETUP.md) | Environment configuration |
| [0G_INTEGRATION_GUIDE.md](0G_INTEGRATION_GUIDE.md) | Setup & architecture |
| [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) | Project overview |

## 🎯 Success Criteria

Your setup is ready when:

- [ ] `.env.local` created with valid private key
- [ ] Testnet tokens received from faucet
- [ ] `npm run dev` starts without errors
- [ ] Compute API returns analysis with jobId
- [ ] Storage API stores and retrieves reports
- [ ] On-chain registration works in browser
- [ ] Reports appear on Reports page
- [ ] ChainScan shows your transactions

## 🚀 Deployment Checklist

Before hackathon demo:

- [ ] Test with 5+ different contracts
- [ ] Verify all gas estimates are reasonable
- [ ] Check error handling works
- [ ] Test with slow network (throttle in DevTools)
- [ ] Verify MetaMask integration
- [ ] Check mobile responsiveness
- [ ] Document deployment steps
- [ ] Set up monitoring/logging

---

**Estimated Time**: 30 minutes from start to successful test run

**Support**: Check SDK_INTEGRATION.md or join [0G Discord](https://discord.gg/0glabs)
