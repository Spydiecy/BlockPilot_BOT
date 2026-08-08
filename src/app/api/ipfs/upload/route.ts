/**
 * IPFS Upload Endpoint
 *
 * Uploads audit reports to IPFS via Pinata.
 * Returns the IPFS CID for on-chain verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveReport } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, metadata } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Wrap content with metadata before uploading
    const reportData = JSON.stringify({
      content,
      metadata: metadata || {},
      uploadedAt: Date.now(),
    });

    console.log('Uploading report to IPFS via Pinata...');
    const cid = await saveReport(reportData);

    console.log(`Report uploaded successfully. CID: ${cid}`);

    return NextResponse.json({
      success: true,
      cid,
      timestamp: Date.now(),
      size: reportData.length,
      network: 'IPFS via Pinata',
      message: 'Report stored successfully on IPFS',
    });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : String(error),
        hint: 'Check that PINATA_JWT is set in .env.local',
      },
      { status: 500 }
    );
  }
}
