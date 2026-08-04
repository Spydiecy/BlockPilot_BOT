/**
 * 0G Storage Download Endpoint
 * 
 * Retrieves audit reports from 0G Storage using their root hash.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportHash } = body;

    if (!reportHash) {
      return NextResponse.json(
        { error: 'Report hash is required' },
        { status: 400 }
      );
    }

    // Download from 0G Storage network
    console.log(`Downloading report from 0G Storage: ${reportHash}`);
    const storedData = await getReport(reportHash);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        const content = data.content;
        
        // Parse report content
        let report;
        try {
          report = JSON.parse(content);
        } catch {
          report = content; // Return as-is if not JSON
        }

        return NextResponse.json({
          success: true,
          reportHash,
          report,
          metadata: data.metadata || {},
          uploadedAt: data.uploadedAt,
          timestamp: Date.now(),
          network: '0G Storage Network',
        });
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid stored data format' },
          { status: 400 }
        );
      }
    }

    // Report not found
    return NextResponse.json(
      {
        error: 'Report not found',
        hint: 'Report may not exist or hash is incorrect',
        reportHash,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error downloading from 0G Storage:', error);
    return NextResponse.json(
      { error: 'Download failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
