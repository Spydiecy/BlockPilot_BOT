import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, AUDIT_REGISTRY_ABI } from '@/utils/contracts';

const BOT_RPC_URL = 'https://rpc.bohr.life';
const provider = new ethers.JsonRpcProvider(BOT_RPC_URL);
const contractAddress = CONTRACT_ADDRESSES.botTestnet;

const contract = new ethers.Contract(
  contractAddress,
  AUDIT_REGISTRY_ABI,
  provider
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params = [] } = body;

    let result;

    switch (method) {
      case 'getTotalContracts':
        result = await contract.getTotalContracts();
        return NextResponse.json({ result: Number(result) });

      case 'getAllAudits': {
        const { startIndex, limit } = params[0];
        const auditsData = await contract.getAllAudits(startIndex, limit);

        // BOT Chain Testnet limits eth_getLogs to 10,000 blocks per query.
        // Fetch tx hash per audit using a sliding recent-blocks window.
        const currentBlock = await provider.getBlockNumber();
        const MAX_RANGE = 9000; // stay safely under the 10k limit
        const fromBlock = Math.max(0, currentBlock - MAX_RANGE);

        const audits = [];
        for (let i = 0; i < auditsData.contractHashes.length; i++) {
          const contractHash = auditsData.contractHashes[i];

          let transactionHash = null;
          try {
            const filter = contract.filters.AuditRegistered(contractHash);
            // Only query the recent window — avoids the 10k block limit error
            const events = await contract.queryFilter(filter, fromBlock, 'latest');
            const matchingEvent = events.find((event: any) =>
              event.args?.auditor?.toLowerCase() === auditsData.auditors[i].toLowerCase() &&
              Number(event.args?.timestamp) === Number(auditsData.timestamps[i])
            );
            if (matchingEvent) {
              transactionHash = matchingEvent.transactionHash;
            }
          } catch (error) {
            // Non-fatal — tx hash is cosmetic, audit data is already stored
            console.warn('Could not fetch tx hash for audit (non-fatal):', contractHash);
          }

          audits.push({
            contractHash,
            stars: Number(auditsData.stars[i]),
            reportCID: auditsData.reportCIDs[i],
            auditor: auditsData.auditors[i],
            timestamp: Number(auditsData.timestamps[i]),
            analysisJobId: auditsData.analysisJobIds[i],
            transactionHash: transactionHash || '0x',
          });
        }

        return NextResponse.json({ result: audits });
      }

      case 'getAuditorHistory': {
        const address = params[0];
        const contractHashes = await contract.getAuditorHistory(address);
        return NextResponse.json({
          result: contractHashes.map((hash: string) => hash),
        });
      }

      case 'getAuditorAudits': {
        // Returns full audit data + tx hashes for a specific auditor
        // Uses a recent block window to avoid BOT Chain's 10k block limit on eth_getLogs
        const auditorAddress = params[0];
        const contractHashes = await contract.getAuditorHistory(auditorAddress);

        const currentBlock = await provider.getBlockNumber();
        const MAX_RANGE = 9000;
        const fromBlock = Math.max(0, currentBlock - MAX_RANGE);

        const audits = [];
        for (const hash of contractHashes) {
          const contractAudits = await contract.getContractAudits(hash);
          const userAudits = contractAudits.filter(
            (a: any) => a.auditor?.toLowerCase() === auditorAddress.toLowerCase()
          );

          for (const audit of userAudits) {
            // Fetch tx hash from event log (recent blocks only)
            let transactionHash = '0x';
            try {
              const filter = contract.filters.AuditRegistered(hash);
              const events = await contract.queryFilter(filter, fromBlock, 'latest');
              const match = events.find((e: any) =>
                e.args?.auditor?.toLowerCase() === auditorAddress.toLowerCase() &&
                Number(e.args?.timestamp) === Number(audit.timestamp)
              );
              if (match) transactionHash = match.transactionHash;
            } catch {
              // Non-fatal
            }

            audits.push({
              contractHash: hash,
              transactionHash,
              stars: Number(audit.stars),
              summaryPreview: audit.summaryPreview,
              reportCID: audit.reportCID,
              auditor: audit.auditor,
              timestamp: Number(audit.timestamp),
              criticalIssues: Number(audit.criticalIssues || 0),
              highIssues: Number(audit.highIssues || 0),
              mediumIssues: Number(audit.mediumIssues || 0),
              analysisJobId: audit.analysisJobId,
            });
          }
        }

        return NextResponse.json({ result: audits });
      }

      case 'getContractAudits': {
        const contractHash = params[0];
        const contractAudits = await contract.getContractAudits(contractHash);
        const formattedAudits = contractAudits.map((audit: any) => ({
          stars: Number(audit.stars),
          summaryPreview: audit.summaryPreview,
          reportCID: audit.reportCID,
          auditor: audit.auditor,
          timestamp: Number(audit.timestamp),
        }));
        return NextResponse.json({ result: formattedAudits });
      }

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
