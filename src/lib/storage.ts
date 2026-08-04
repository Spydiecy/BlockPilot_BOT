/**
 * 0G Storage - Real Implementation
 * 
 * Using @0gfoundation/0g-storage-ts-sdk for actual 0G Storage network uploads.
 * Reports are stored on the decentralized 0G Storage network.
 */

import { Indexer, MemData } from '@0gfoundation/0g-storage-ts-sdk';
import { ethers } from 'ethers';

// 0G Storage configuration
const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
const PRIVATE_KEY = process.env.OG_PRIVATE_KEY;

// Initialize provider and signer
let provider: ethers.JsonRpcProvider;
let signer: ethers.Wallet;
let indexer: Indexer;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  if (PRIVATE_KEY) {
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
  }
  indexer = new Indexer(INDEXER_RPC);
  console.log('0G Storage SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize 0G Storage SDK:', error);
}

// Upload report to 0G Storage
export async function saveReport(content: string): Promise<string> {
  try {
    if (!signer) {
      throw new Error('Signer not initialized - check OG_PRIVATE_KEY in .env.local');
    }

    // Create in-memory data object
    const data = new MemData(new TextEncoder().encode(content));
    
    // Upload to 0G Storage
    console.log('Uploading to 0G Storage network...');
    const [result, uploadErr] = await indexer.upload(data, RPC_URL, signer);
    
    if (uploadErr) {
      console.error('0G Storage upload error:', uploadErr);
      throw uploadErr;
    }
    
    // Extract root hash from result
    // Result can be single upload or batch upload
    let rootHash: string;
    if (typeof result === 'string') {
      rootHash = result;
    } else if ('rootHash' in result) {
      rootHash = result.rootHash;
    } else if ('rootHashes' in result && result.rootHashes.length > 0) {
      rootHash = result.rootHashes[0];
    } else {
      throw new Error('Unexpected upload result format');
    }
    
    console.log('Successfully uploaded to 0G Storage. Root hash:', rootHash);
    return rootHash;
  } catch (error) {
    console.error('Error uploading to 0G Storage:', error);
    throw error;
  }
}

// Download report from 0G Storage
export async function getReport(rootHash: string): Promise<string | null> {
  try {
    // Create a temporary file path for download
    const tempPath = `/tmp/0g-report-${Date.now()}.json`;
    
    // Download from 0G Storage with Merkle proof verification
    console.log('Downloading from 0G Storage network...');
    const err = await indexer.download(rootHash, tempPath, true);
    
    if (err) {
      console.error('0G Storage download error:', err);
      return null;
    }
    
    // Read the downloaded file
    const fs = await import('fs');
    const content = fs.readFileSync(tempPath, 'utf-8');
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    console.log('Successfully downloaded from 0G Storage');
    return content;
  } catch (error) {
    console.error('Error downloading from 0G Storage:', error);
    return null;
  }
}

// Helper function to get storage stats
export function getStorageStats() {
  return {
    network: '0G Storage Network',
    indexer: INDEXER_RPC,
    rpc: RPC_URL,
    status: signer ? 'Connected' : 'Not configured',
  };
}
