/**
 * 0G Compute Integration
 * Handles AI inference requests through 0G Compute Network
 * Records the job ID for proof-of-execution on-chain
 */

export interface ComputeJobResult {
  jobId: string; // 0G Compute job ID (bytes32)
  result: string; // The inference result
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

// 0G Compute configuration for Galileo Testnet
export const ZERO_G_COMPUTE_CONFIG = {
  // For the Router path (recommended for dApps)
  routerEndpoint: 'https://compute-marketplace.0g.ai/inference', // Web UI or API
  // For Direct path with providers
  webUIUrl: 'https://pc.0g.ai/', // Advanced mode for Direct flow
  marketplaceUrl: 'https://compute-marketplace.0g.ai/inference',
};

/**
 * Run AI audit analysis through 0G Compute Network
 * Uses the Router path for simplicity and unified balance management
 * 
 * In production, you'll integrate with the 0G Compute SDK:
 * @0gfoundation/0g-compute-ts-sdk
 * 
 * @param contractCode - The smart contract code to audit
 * @returns Promise<ComputeJobResult> - Job ID and initial analysis result
 */
export async function runAuditAnalysisOn0GCompute(contractCode: string): Promise<ComputeJobResult> {
  try {
    // Call backend endpoint that submits the job to 0G Compute
    const response = await fetch('/api/0g-compute/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractCode,
        model: 'security-audit', // or whatever model we select
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      jobId: data.jobId, // bytes32 from 0G Compute
      result: data.result,
      status: 'completed',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error running audit on 0G Compute:', error);
    throw error;
  }
}

/**
 * Get status of a 0G Compute job
 * 
 * @param jobId - The job ID returned from analysis submission
 * @returns Promise with job status and result
 */
export async function getComputeJobStatus(jobId: string): Promise<ComputeJobResult> {
  try {
    const response = await fetch('/api/0g-compute/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking job status:', error);
    throw error;
  }
}

/**
 * Generate a placeholder job ID for testing
 * In production, this comes from 0G Compute submission
 * 
 * @returns bytes32-formatted job ID
 */
export function generatePlaceholderJobId(): string {
  const randomBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
  );
  return '0x' + randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format job ID as bytes32
 * @param input - Job ID string
 * @returns bytes32 hex string
 */
export function formatJobIdAsBytes32(input: string): string {
  if (input.startsWith('0x')) {
    return input.padEnd(66, '0'); // 0x + 64 hex chars
  }
  return '0x' + input.padEnd(64, '0');
}
