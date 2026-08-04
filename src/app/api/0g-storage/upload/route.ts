/**
 * 0G Storage Upload Endpoint
 * 
 * Uploads audit reports to 0G Storage network using the official SDK.
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

    // Prepare the full report data
    const reportData = JSON.stringify({
      content,
      metadata: metadata || {},
      uploadedAt: Date.now(),
    });

    // Upload to 0G Storage network
    console.log('Uploading report to 0G Storage network...');
    const rootHash = await saveReport(reportData);

    console.log(`Report uploaded successfully. Root hash: ${rootHash}`);

    return NextResponse.json({
      success: true,
      reportHash: rootHash,
      timestamp: Date.now(),
      size: reportData.length,
      network: '0G Storage Network',
      indexer: 'https://indexer-storage-testnet-turbo.0g.ai',
      message: 'Report stored successfully on 0G Storage network',
    });
  } catch (error) {
    console.error('Error uploading to 0G Storage:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : String(error),
        hint: 'Check that OG_PRIVATE_KEY is set in .env.local and wallet has testnet tokens'
      },
      { status: 500 }
    );
  }
}
