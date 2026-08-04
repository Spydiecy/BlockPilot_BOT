// src/app/api/0g-compute/init/route.ts
// One-time setup: creates ledger account and funds it

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Use require for CommonJS module to work around exports field restrictions
const createBroker = async (wallet: ethers.Wallet) => {
  // @ts-ignore - Using require for CommonJS compatibility
  const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
  return createZGComputeNetworkBroker(wallet);
};

export async function POST(request: NextRequest) {
  try {
    const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.OG_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json(
        { error: 'OG_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    const balanceInOG = ethers.formatEther(balance);
    console.log(`Wallet: ${wallet.address}, Balance: ${balanceInOG} OG`);

    // ✅ CORRECT: use @0glabs/0g-serving-broker
    const broker = await createBroker(wallet);

    // ✅ CORRECT: check if ledger already exists first
    let existingLedger = null;
    try {
      existingLedger = await broker.ledger.getLedger();
      console.log('Existing ledger found:', existingLedger);
    } catch {
      console.log('No existing ledger — will create one');
    }

    if (existingLedger) {
      const currentBalance = ethers.formatEther(existingLedger.totalBalance);
      return NextResponse.json({
        success: true,
        message: 'Ledger account already exists',
        walletAddress: wallet.address,
        walletBalance: balanceInOG,
        ledgerBalance: currentBalance,
        alreadyInitialized: true,
      });
    }

    // ✅ CORRECT: broker.ledger.addLedger(amount_in_OG_units)
    // This creates the main account AND routes funds correctly — NOT a raw transfer
    const initialFund = 5; // 5 OG tokens
    console.log(`Creating ledger with ${initialFund} OG...`);
    await broker.ledger.addLedger(initialFund);
    console.log('Ledger created successfully');

    const ledger = await broker.ledger.getLedger();
    const ledgerBalance = ethers.formatEther(ledger.totalBalance);

    return NextResponse.json({
      success: true,
      message: 'Ledger account created and funded successfully',
      walletAddress: wallet.address,
      walletBalance: ethers.formatEther(await provider.getBalance(wallet.address)),
      ledgerBalance,
    });

  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      {
        error: 'Initialization failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
