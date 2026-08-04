# 🔧 Environment Setup Guide

## Quick Start

### Step 1: Install SDKs
```bash
cd /Users/spydiecy/Documents/Projects/BlockPilot
npm install @0gfoundation/0g-compute-ts-sdk
```

✅ Already installed: v0.8.3

### Step 2: Create `.env.local`
```bash
cat > .env.local << EOF
# 0G Network Configuration
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_PRIVATE_KEY=your_wallet_private_key_here

# Optional: IPFS Gateway
IPFS_GATEWAY=https://ipfs.io/ipfs/
EOF
```

### Step 3: Get Your Private Key

**From MetaMask**:
1. Open MetaMask extension
2. Click your account icon → Settings
3. Go to Security & Privacy
4. Click "Show Private Key"
5. Copy the key and paste into `.env.local`

**From CLI**:
```bash
# If using ethers.js directly
ethers account list
```

### Step 4: Fund Your Account

1. Visit 0G Testnet Faucet: https://faucet.0g.ai
2. Connect MetaMask with your wallet
3. Request testnet tokens
4. Wait 1-2 minutes for confirmation

**Verify balance**:
```bash
npx hardhat run scripts/check-balance.js --network 0g-testnet
```

### Step 5: Test the Integration

```bash
# Start development server
npm run dev

# Test compute endpoint in another terminal
curl -X POST http://localhost:3000/api/0g-compute/analyze \
  -H "Content-Type: application/json" \
  -d '{"contractCode":"pragma solidity ^0.8.0; contract Test {}"}'
```

Expected response:
```json
{
  "success": true,
  "jobId": "0x...",
  "analysis": {
    "summary": "...",
    "vulnerabilities": { "critical": [], "high": [], ... },
    "stars": 4
  }
}
```

## Environment Variables Reference

### Required for 0G Compute

| Variable | Value | Notes |
|----------|-------|-------|
| `OG_RPC_URL` | `https://evmrpc-testnet.0g.ai` | 0G testnet RPC endpoint |
| `OG_PRIVATE_KEY` | Your wallet private key | Must have 0G tokens |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `IPFS_GATEWAY` | `https://ipfs.io/ipfs/` | Fallback storage gateway |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Wallet Setup

### Create a New Wallet

**Option 1: MetaMask (Easiest)**
1. Install MetaMask extension
2. Create new account
3. Copy private key from settings
4. Save to `.env.local`

**Option 2: Command Line**
```bash
npx ethers new
# Follow prompts, save private key

# Or use existing JSON keystore
npx ethers account list
```

**Option 3: Hardhat**
```bash
npx hardhat accounts
# Shows first 20 accounts with keys
```

### Add 0G Testnet to MetaMask

1. Open MetaMask
2. Click network selector → Add Network
3. Fill in:
   - Network Name: `0G Galileo Testnet`
   - RPC URL: `https://evmrpc-testnet.0g.ai`
   - Chain ID: `16602`
   - Currency Symbol: `0G`
   - Block Explorer: `https://chainscan-galileo.0g.ai`
4. Save and switch to new network

### Get Testnet Tokens

**Method 1: 0G Faucet**
```
https://faucet.0g.ai
```

**Method 2: Discord Faucet** (if available)
```
Discord: https://discord.gg/0glabs
Channel: #faucet
Command: !faucet your_address
```

**Method 3: Manual (testnet only)**
- Contact 0G team on Discord
- Request tokens for testing

## Verify Setup

Run this test script:

```bash
cat > test-setup.mjs << 'EOF'
import { ethers } from 'ethers';

async function testSetup() {
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.OG_PRIVATE_KEY;
  
  console.log('🔍 Testing 0G Setup...\n');
  
  // Test 1: RPC Connection
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ RPC Connection:', blockNumber);
  } catch (e) {
    console.log('❌ RPC Connection failed:', e.message);
    return;
  }
  
  // Test 2: Wallet
  if (!privateKey) {
    console.log('❌ OG_PRIVATE_KEY not set');
    return;
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;
    const balance = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balance);
    
    console.log('✅ Wallet:', address);
    console.log('✅ Balance:', balanceEth, '0G');
    
    if (parseFloat(balanceEth) < 0.1) {
      console.log('⚠️  Balance is low. Use faucet: https://faucet.0g.ai');
    }
  } catch (e) {
    console.log('❌ Wallet error:', e.message);
  }
}

testSetup().catch(console.error);
EOF

OG_PRIVATE_KEY=your_key npx node test-setup.mjs
```

## Troubleshooting

### Issue: "OG_PRIVATE_KEY environment variable not set"

**Solution**:
```bash
# Add to .env.local
OG_PRIVATE_KEY=your_private_key_here

# Or set temporarily
export OG_PRIVATE_KEY=your_private_key_here
npm run dev
```

### Issue: "No providers available"

**Cause**: Wallet doesn't have funds or account not funded with broker

**Solution**:
1. Check balance: Visit https://chainscan-galileo.0g.ai and search your address
2. Get faucet tokens: https://faucet.0g.ai
3. Wait 1-2 minutes for confirmation
4. Run test script to verify

### Issue: "Invalid private key"

**Cause**: Key format incorrect

**Solution**:
- Key should start with `0x` and be 64 hex characters
- Copy from MetaMask exactly
- Don't include quotes in .env file

```bash
# ✅ Correct
OG_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# ❌ Wrong
OG_PRIVATE_KEY="0x1234..."  # Don't use quotes
OG_PRIVATE_KEY=1234...     # Must have 0x prefix
```

### Issue: "Connection refused" or timeout

**Cause**: RPC endpoint down or network issue

**Solution**:
1. Check RPC status: https://0g.ai/status
2. Try alternative RPC: 
   ```bash
   OG_RPC_URL=https://testnet-rpc-backup.0g.ai npm run dev
   ```
3. Check internet connection
4. Verify firewall/VPN not blocking

### Issue: "Insufficient balance for gas"

**Cause**: Wallet balance too low

**Solution**:
1. Get more tokens from faucet
2. Check current balance on ChainScan
3. Gas is very cheap on testnet (usually < 0.001 0G)

## Security Best Practices

⚠️ **IMPORTANT**:

1. **Never commit `.env.local`** (already in `.gitignore`)
2. **Never share private keys** in messages/calls/commits
3. **Use different wallets** for dev/staging/production
4. **Rotate keys regularly** in production
5. **Use hardware wallet** for mainnet (post-hackathon)

### For Production Deployment

Use secure environment variable management:
- **Vercel**: Settings → Environment Variables (encrypted)
- **AWS**: Secrets Manager
- **Azure**: Key Vault
- **Docker**: Secret mounts, not ENV
- **Kubernetes**: Secrets

Example for production:
```bash
# Store in Vercel
vercel env add OG_PRIVATE_KEY

# Use in runtime
echo "Production setup with Vercel Secrets"
```

## Switching Networks

### Testnet (Hackathon)
```bash
# Already configured
OG_RPC_URL=https://evmrpc-testnet.0g.ai
```

### Mainnet (Post-Hackathon)
```bash
# Update when available
OG_RPC_URL=https://evmrpc-mainnet.0g.ai
# Also update contract addresses
```

## Advanced Setup

### Using with Hardhat

```bash
# hardhat.config.js
module.exports = {
  networks: {
    0gTestnet: {
      url: 'https://evmrpc-testnet.0g.ai',
      accounts: [process.env.OG_PRIVATE_KEY],
    },
  },
};
```

### Using with Truffle

```javascript
// truffle-config.js
require('dotenv').config();

module.exports = {
  networks: {
    0gTestnet: {
      provider: () => new HDWalletProvider(
        process.env.OG_PRIVATE_KEY,
        'https://evmrpc-testnet.0g.ai'
      ),
      network_id: 16602,
    },
  },
};
```

### CI/CD Setup

**GitHub Actions** (.github/workflows/test.yml):
```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
        env:
          OG_PRIVATE_KEY: ${{ secrets.OG_PRIVATE_KEY }}
          OG_RPC_URL: https://evmrpc-testnet.0g.ai
```

## Next Steps

1. ✅ Set up `.env.local` with private key
2. ✅ Get testnet tokens from faucet
3. ✅ Run `npm run dev`
4. ✅ Test endpoints with curl
5. ✅ Run full audit flow
6. ⏳ Deploy to staging
7. ⏳ Post-hackathon: Mainnet setup

---

**Questions?** Check [SDK_INTEGRATION.md](SDK_INTEGRATION.md) or join [0G Discord](https://discord.gg/0glabs)
