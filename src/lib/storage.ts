/**
 * IPFS Storage via Pinata SDK v2.5.6
 *
 * Uses the official `pinata` npm package — latest as of 2026.
 * Free tier: 1GB storage + 1 dedicated IPFS gateway.
 *
 * .env.local setup:
 *   PINATA_JWT=your_jwt_here
 *   NEXT_PUBLIC_GATEWAY_URL=your-subdomain.mypinata.cloud
 *
 * Get your keys at: https://app.pinata.cloud/developers/keys
 * Get your gateway at: https://app.pinata.cloud/gateway
 */

import { pinata } from './pinata'

/**
 * Upload a JSON audit report to IPFS via Pinata.
 * Returns the IPFS CID — stored on-chain as reportCID.
 */
export async function saveReport(content: string): Promise<string> {
  if (!process.env.PINATA_JWT) {
    throw new Error('PINATA_JWT not configured in .env.local')
  }

  const parsed = JSON.parse(content)

  const result = await pinata.upload.public.json(parsed, {
    metadata: {
      name: `blockpilot-audit-${Date.now()}`,
    },
  })

  console.log('Uploaded to IPFS. CID:', result.cid)
  return result.cid
}

/**
 * Retrieve a report from IPFS using its CID.
 * Uses pinata.gateways.public.get() — direct data fetch (SDK v2.5+).
 * Falls back to public ipfs.io gateway if no dedicated gateway is set.
 */
export async function getReport(cid: string): Promise<string | null> {
  try {
    if (process.env.NEXT_PUBLIC_GATEWAY_URL) {
      // Use dedicated gateway — fastest, no rate limits
      const { data } = await pinata.gateways.public.get(cid)
      return JSON.stringify(data)
    }

    // Fallback: public gateway (slower, rate-limited)
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`)
    if (!response.ok) return null
    return await response.text()
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return null
  }
}

/**
 * Unpin a file from Pinata by CID.
 * Called when on-chain registration fails — no point keeping the IPFS file.
 * Uses the official Pinata SDK (v2.5+) for clean deletion.
 */
export async function deleteReport(cid: string): Promise<void> {
  if (!process.env.PINATA_JWT) return;

  try {
    // List files matching this CID
    const files = await pinata.files.public.list().cid(cid);
    const rows = files.files ?? [];

    if (rows.length === 0) {
      console.warn('No pinned file found for CID:', cid);
      return;
    }

    // Delete each match by file ID (should only be one)
    for (const file of rows) {
      await pinata.files.public.delete([file.id]);
      console.log('Unpinned from IPFS:', file.cid, '(id:', file.id, ')');
    }
  } catch (error) {
    // Non-fatal — just log, don't throw
    console.warn('Failed to unpin IPFS file:', cid, error);
  }
}

export function getStorageStats() {
  return {
    network: 'IPFS via Pinata',
    sdk: 'pinata@2.5.6',
    gateway: process.env.NEXT_PUBLIC_GATEWAY_URL || 'ipfs.io (public fallback)',
    status: process.env.PINATA_JWT ? 'Connected' : 'Not configured',
  }
}
