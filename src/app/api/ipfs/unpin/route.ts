/**
 * IPFS Unpin Endpoint
 *
 * Deletes a file from Pinata when on-chain registration fails.
 * Keeps IPFS storage clean — no orphaned reports.
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteReport } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cid } = body;

    if (!cid || typeof cid !== 'string') {
      return NextResponse.json({ error: 'CID is required' }, { status: 400 });
    }

    await deleteReport(cid);

    return NextResponse.json({ success: true, cid });
  } catch (error) {
    console.error('Unpin error:', error);
    // Return success anyway — client shouldn't fail because of cleanup
    return NextResponse.json({ success: false, error: String(error) });
  }
}
