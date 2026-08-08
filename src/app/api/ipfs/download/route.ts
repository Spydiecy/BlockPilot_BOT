/**
 * IPFS Download Endpoint
 *
 * Retrieves audit reports from IPFS using their CID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cid } = body;

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching report from IPFS. CID: ${cid}`);
    const storedData = await getReport(cid);

    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        const content = data.content;

        let report;
        try {
          report = JSON.parse(content);
        } catch {
          report = content;
        }

        return NextResponse.json({
          success: true,
          cid,
          report,
          metadata: data.metadata || {},
          uploadedAt: data.uploadedAt,
          timestamp: Date.now(),
          network: 'IPFS via Pinata',
        });
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid stored data format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Report not found',
        hint: 'Report may not exist or CID is incorrect',
        cid,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    return NextResponse.json(
      { error: 'Download failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
