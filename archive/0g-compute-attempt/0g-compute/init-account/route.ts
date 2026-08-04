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

    const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, ethersProvider);

    console.log('Wallet address:', wallet.address);
    const rawBalance = await ethersProvider.getBalance(wallet.address);
    const balanceInOG = ethers.formatEther(rawBalance);
    console.log(`Wallet balance: ${balanceInOG} OG`);

    if (parseFloat(balanceInOG) < 1) {
      return NextResponse.json(
        {
          error: 'Insufficient wallet balance',
          hint: `Need at least 1 OG. Current: ${balanceInOG} OG. Get tokens at https://faucet.0g.ai`,
          walletAddress: wallet.address,
        },
        { status: 400 }
      );
    }

    // ✅ CORRECT: use broker.ledger — NOT broker.account
    console.log('Initializing broker...');
    const broker = await createBroker(wallet);
    console.log('Broker initialized');

    // Check if ledger already exists
    let existingLedger = null;
    try {
      existingLedger = await broker.ledger.getLedger();
      console.log('Existing ledger found');
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

    // ✅ CORRECT: broker.ledger.addLedger(amount_as_number)
    // This creates the account AND routes funds — do NOT send raw ETH to provider
    const initialFund = 1; // 1OG tokens
    console.log(`Creating ledger with ${initialFund} OG...`);
    await broker.ledger.addLedger(initialFund);
    console.log('Ledger created successfully');

    const ledger = await broker.ledger.getLedger();
    const ledgerBalance = ethers.formatEther(ledger.totalBalance);
    const updatedWalletBalance = ethers.formatEther(
      await ethersProvider.getBalance(wallet.address)
    );

    return NextResponse.json({
      success: true,
      message: 'Ledger account created and funded with 5 OG',
      walletAddress: wallet.address,
      walletBalance: updatedWalletBalance,
      ledgerBalance,
    });

  } catch (error) {
    console.error('Error initializing account:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize account',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
