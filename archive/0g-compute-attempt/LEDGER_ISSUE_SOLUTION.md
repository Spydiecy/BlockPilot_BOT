// Alternative implementation using 0G Private Computer (Router API)
// This bypasses the ledger issue entirely!

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractCode } = body;

    if (!contractCode) {
      return NextResponse.json(
        { error: 'contractCode is required' },
        { status: 400 }
      );
    }

    // Build audit prompt
    const analysisPrompt = `You are an expert Solidity smart contract security auditor. Analyze the following contract and provide a comprehensive security audit.

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\`

Return ONLY valid JSON in this exact structure, no extra text:
{
  "summary": "Brief security summary (max 100 chars)",
  "vulnerabilities": {
    "critical": ["critical issue descriptions"],
    "high": ["high severity issues"],
    "medium": ["medium severity issues"],
    "low": ["low severity issues"]
  },
  "recommendations": ["actionable recommendations"],
  "gasOptimizations": ["gas optimization tips"],
  "stars": 4
}`;

    // Use 0G Private Computer API (no ledger needed!)
    const response = await fetch('https://pc.0g.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: Add API key if you have one
        // 'Authorization': `Bearer ${process.env.OG_PC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b', // or other available models
        messages: [
          {
            role: 'system',
            content: 'You are a Solidity security expert. Return analysis as JSON only.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('0G PC API error:', errText);
      return NextResponse.json(
        { error: '0G Private Computer request failed', details: errText },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Extract job ID from response
    const jobId = result.id || ('0x' + crypto.randomUUID().replace(/-/g, ''));

    // Parse analysis JSON from model response
    const analysisText = result.choices?.[0]?.message?.content || '';
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      analysis = null;
    }

    if (!analysis) {
      analysis = {
        summary: analysisText.substring(0, 100),
        vulnerabilities: { critical: [], high: [], medium: [], low: [] },
        recommendations: [],
        gasOptimizations: [],
        stars: 3,
      };
    }

    return NextResponse.json({
      success: true,
      jobId,
      model: 'llama-3.1-8b',
      analysis,
      timestamp: Date.now(),
      message: 'Analysis completed via 0G Private Computer',
      source: '0G PC (no ledger required)',
    });

  } catch (error: any) {
    console.error('Error in 0G PC analysis:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
