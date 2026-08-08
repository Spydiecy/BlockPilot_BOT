/**
 * IPFS Storage Integration
 * Handles uploading audit reports to IPFS via Pinata
 * and retrieving the CID for on-chain verification
 */

/**
 * Upload an audit report to IPFS
 * Returns the IPFS CID for on-chain storage
 *
 * @param reportContent - The audit report content (JSON string)
 * @returns Promise<string> - IPFS CID of the stored report
 */
export async function uploadAuditReportToIPFS(reportContent: string): Promise<string> {
  try {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: reportContent }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Retrieve an audit report from IPFS using its CID
 *
 * @param cid - The IPFS content identifier
 * @returns Promise<string> - The retrieved report content
 */
export async function downloadAuditReportFromIPFS(cid: string): Promise<string> {
  try {
    const response = await fetch('/api/ipfs/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cid }),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error downloading from IPFS:', error);
    throw error;
  }
}

/**
 * Generate a placeholder job ID for analysis tracking
 * @returns bytes32 hex string
 */
export function generatePlaceholderJobId(): string {
  const randomBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
  );
  return '0x' + randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Unpin an IPFS file when on-chain registration fails.
 * Fire-and-forget — won't throw.
 */
export async function unpinIPFSReport(cid: string): Promise<void> {
  if (!cid) return;
  try {
    await fetch('/api/ipfs/unpin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid }),
    });
  } catch {
    // Non-fatal, just log
    console.warn('Failed to unpin IPFS report:', cid);
  }
}
