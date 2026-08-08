/**
 * Server-side API route for smart contract documentation generation.
 * Uses MISTRAL_API_KEY (server-only) — never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractCode, purpose, recipientInfo, technicalLevel } = body;

    if (!contractCode) {
      return NextResponse.json({ error: 'contractCode is required' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    const prompt = `You are an expert Solidity smart contract analyzer. Analyze this smart contract and provide a structured documentation object.
      
DOCUMENTATION CONTEXT:
- Purpose: ${purpose || 'General documentation'}
- Intended for: ${recipientInfo || 'General audience'}
- Technical Level: ${technicalLevel || 'intermediate'}

INSTRUCTIONS:
- Tailor descriptions to the ${technicalLevel || 'intermediate'} technical level
- Focus on aspects relevant to: ${purpose || 'General documentation'}
- For "beginner" level: Use simple language, explain concepts
- For "intermediate" level: Balance technical detail with clarity
- For "advanced" level: Use precise technical terminology, include implementation details

The response should be ONLY a valid JSON object with this structure:
{
  "name": "contract name",
  "description": "brief description",
  "version": "solidity version",
  "license": "license type",
  "functions": [{"name":"","description":"","params":[{"name":"","type":"","description":""}],"visibility":""}],
  "events": [{"name":"","description":"","params":[{"name":"","type":"","indexed":false}]}],
  "variables": [{"name":"","type":"","visibility":"","description":""}]
}

Contract code:
${contractCode}

Important: Return ONLY the JSON object, no additional text or backticks.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Mistral API error', details: err }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    let docs;
    try {
      docs = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse documentation response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, documentation: docs });
  } catch (error: any) {
    console.error('Documentation generation error:', error);
    return NextResponse.json({ error: 'Documentation generation failed', details: error?.message }, { status: 500 });
  }
}
