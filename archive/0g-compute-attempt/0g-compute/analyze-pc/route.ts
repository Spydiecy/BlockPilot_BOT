// 0G Private Computer API - Simple inference without ledger management
// This is the RECOMMENDED approach for immediate use!

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

    console.log('Using 0G Private Computer for analysis...');

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
    console.log('Calling 0G Private Computer API...');
    const response = await fetch('https://pc.0g.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: Add API key if you have one
        // 'Authorization': `Bearer ${process.env.OG_PC_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b', // Fast and efficient model
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
        { 
          error: '0G Private Computer request failed', 
          details: errText,
          hint: 'The 0G PC API might be temporarily unavailable. Try again in a moment.',
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Received response from 0G PC');

    // Extract job ID from response
    const jobId = result.id || ('0x' + crypto.randomUUID().replace(/-/g, ''));

    // Parse analysis JSON from model response
    const analysisText = result.choices?.[0]?.message?.content || '';
    let analysis;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.warn('Failed to parse JSON from response, using fallback');
      analysis = null;
    }

    // Fallback if JSON parsing fails
    if (!analysis) {
      analysis = {
        summary: analysisText.substring(0, 100) || 'Analysis completed',
        vulnerabilities: { 
          critical: [], 
          high: [], 
          medium: [], 
          low: [] 
        },
        recommendations: ['Review the full analysis text for details'],
        gasOptimizations: [],
        stars: 3,
        rawResponse: analysisText, // Include raw response for debugging
      };
    }

    return NextResponse.json({
      success: true,
      jobId,
      model: 'llama-3.1-8b',
      provider: '0G Private Computer',
      analysis,
      timestamp: Date.now(),
      message: 'Analysis completed via 0G Private Computer (no ledger required)',
      source: '0G PC',
    });

  } catch (error: any) {
    console.error('Error in 0G PC analysis:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error?.message || String(error),
        hint: 'Check server logs for more details',
      },
      { status: 500 }
    );
  }
}
