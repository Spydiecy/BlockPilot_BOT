import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI } from '@/utils/contracts';
import { CHAIN_CONFIG } from '@/utils/web3';

const PHAROS_RPC_URL = 'https://rpc.primordial.bdagscan.com';
const provider = new ethers.JsonRpcProvider(PHAROS_RPC_URL);
const contractAddress = CONTRACT_ADDRESSES.blockdagTestnet;

// Initialize contract
const contract = new ethers.Contract(
  contractAddress,
  AUDIT_REGISTRY_ABI,
  provider
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params = [] } = body;

    // Rate limiting functionality could be added here
    let result;

    switch (method) {
      case 'getTotalContracts':
        result = await contract.getTotalContracts();
        return NextResponse.json({ 
          result: Number(result) 
        });

      case 'getAllAudits':
        const { startIndex, limit } = params[0];
        const auditsData = await contract.getAllAudits(startIndex, limit);
        
        // Transform the data to a more usable format
        const audits = [];
        for (let i = 0; i < auditsData.contractHashes.length; i++) {
          audits.push({
            contractHash: auditsData.contractHashes[i],
            stars: Number(auditsData.stars[i]),
            summary: auditsData.summaries[i],
            auditor: auditsData.auditors[i],
            timestamp: Number(auditsData.timestamps[i]),
          });
        }
        
        return NextResponse.json({ result: audits });

      case 'getAuditorHistory':
        const address = params[0];
        const contractHashes = await contract.getAuditorHistory(address);
        return NextResponse.json({ 
          result: contractHashes.map((hash: string) => hash)
        });

      case 'getContractAudits':
        const contractHash = params[0];
        const contractAudits = await contract.getContractAudits(contractHash);
        
        // Transform the data
        const formattedAudits = contractAudits.map((audit: any) => {
          return {
            stars: Number(audit.stars),
            summary: audit.summary,
            auditor: audit.auditor,
            timestamp: Number(audit.timestamp),
          };
        });
        
        return NextResponse.json({ result: formattedAudits });

      default:
        return NextResponse.json(
          { error: `Unsupported method: ${method}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blockchain API error:', error);
    return NextResponse.json(
      { error: 'Failed to process blockchain request' },
      { status: 500 }
    );
  }
}