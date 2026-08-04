// src/app/api/0g-compute/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Use require for CommonJS module to work around exports field restrictions
const createBroker = async (wallet: ethers.Wallet) => {
  // @ts-ignore - Using require for CommonJS compatibility
  const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
  return createZGComputeNetworkBroker(wallet);
};

// Module-level broker cache
let cachedBroker: any | null = null;

async function getBroker() {
  if (cachedBroker) {
    console.log('Using cached broker');
    return cachedBroker;
  }

  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const privateKey = process.env.OG_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('OG_PRIVATE_KEY environment variable not set');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Creating new broker instance');
  const chainId = (await provider.getNetwork()).chainId;
  console.log(`Detected chain ID: ${chainId}`);

  cachedBroker = await createBroker(wallet);
  return cachedBroker;
}

async function ensureLedgerFunded(broker: any) {
  try {
    const ledger = await broker.ledger.getLedger();
    const balance = parseFloat(ethers.formatEther(ledger.totalBalance));
    console.log(`Ledger balance: ${balance} OG`);

    if (balance < 0.01) {
      console.log('Ledger balance low, topping up 0.05 OG...');
      await broker.ledger.addLedger(0.05); // Small top-up for limited funds
      console.log('Top-up successful');
    }
  } catch (error: any) {
    if (
      error?.message?.includes('not found') ||
      error?.message?.includes('AccountNotExists') ||
      error?.message?.includes('Sub-account not found')
    ) {
      console.log('No ledger found — creating with 0.1 OG...');
      await broker.ledger.addLedger(0.1); // Minimal initial funding
      console.log('Ledger created successfully');
    } else {
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractCode, providerAddress } = body;

    if (!contractCode) {
      return NextResponse.json(
        { error: 'contractCode is required' },
        { status: 400 }
      );
    }

    // Initialize broker
    let broker;
    try {
      broker = await getBroker();
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to initialize broker',
          details: error instanceof Error ? error.message : String(error),
          hint: 'Check OG_PRIVATE_KEY and OG_RPC_URL in .env.local',
        },
        { status: 503 }
      );
    }

    // ✅ Auto-create/fund ledger if missing — handles the AccountNotExists error
    try {
      await ensureLedgerFunded(broker);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Ledger setup failed',
          details: error instanceof Error ? error.message : String(error),
          hint: 'Ensure your wallet has at least 0.1 OG. Get tokens at https://faucet.0g.ai',
        },
        { status: 503 }
      );
    }

    // Use the provider address from your dashboard
    // Provider: qwen-2.5-7b-instruct (0xa48f01287233509FD694a22Bf840225062E67836)
    let provider = providerAddress || '0xa48f01287233509FD694a22Bf840225062E67836';
    
    console.log('Using provider:', provider);

    // Get service metadata (endpoint + model)
    let endpoint: string;
    let serviceModel: string;
    try {
      console.log('Fetching service metadata for provider:', provider);
      const metadata = await broker.inference.getServiceMetadata(provider);
      endpoint = metadata.endpoint;
      serviceModel = metadata.model;
      console.log(`Endpoint: ${endpoint}, Model: ${serviceModel}`);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to get service metadata',
          details: error instanceof Error ? error.message : String(error),
          provider,
        },
        { status: 503 }
      );
    }

    // Build audit prompt
    const analysisPrompt = `You are an expert Solidity smart contract security auditor. Analyze the following contract and provide a comprehensive security audit.

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\`

Return ONLY valid JSON in this exact structure, no extra text:
{
  "summary": "Brief security summary (max 100 chars)",
  "vulnerabilities": {
    "critical": ["critical issue descriptions"],
    "high": ["high severity issues"],
    "medium": ["medium severity issues"],
    "low": ["low severity issues"]
  },
  "recommendations": ["actionable recommendations"],
  "gasOptimizations": ["gas optimization tips"],
  "stars": 4
}`;

    // ✅ CORRECT: getRequestHeaders takes (providerAddress, contentString)
    let headers: Record<string, string>;
    try {
      headers = await broker.inference.getRequestHeaders(provider, analysisPrompt);
    } catch (error: any) {
      // If sub-account still not found, ledger may need more time to confirm
      if (error?.message?.includes('Sub-account not found')) {
        return NextResponse.json(
          {
            error: 'Sub-account not ready yet',
            details: error.message,
            hint: 'Your ledger was just created. Wait 10-15 seconds and retry.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    // Make inference request to the provider
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        model: serviceModel,
        messages: [
          {
            role: 'system',
            content: 'You are a Solidity security expert. Return analysis as JSON only.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Provider API error:', errText);
      return NextResponse.json(
        { error: 'Compute provider request failed', details: errText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // ✅ IMPORTANT: always process response to settle fees
    // Without this, subsequent requests will be denied due to unpaid fees
    try {
      await broker.inference.processResponse(provider, result, analysisPrompt);
      console.log('Response processed and fee settled');
    } catch (feeError) {
      // Non-fatal — log but don't fail the request
      console.warn('Fee settlement warning (non-fatal):', feeError);
    }

    // Extract job ID from response
    const jobId = result.id || ('0x' + crypto.randomUUID().replace(/-/g, ''));

    // Parse analysis JSON from model response
    const analysisText = result.choices?.[0]?.message?.content || '';
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    if (!analysis) {
      analysis = {
        summary: analysisText.substring(0, 100),
        vulnerabilities: { critical: [], high: [], medium: [], low: [] },
        recommendations: [],
        gasOptimizations: [],
        stars: 3,
      };
    }

    return NextResponse.json({
      success: true,
      jobId,
      provider,
      model: serviceModel,
      analysis,
      timestamp: Date.now(),
      message: 'Analysis completed via 0G Compute Network',
    });

  } catch (error: any) {
    console.error('Unhandled error in 0G Compute analysis:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
