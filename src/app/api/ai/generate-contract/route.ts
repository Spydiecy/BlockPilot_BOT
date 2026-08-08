/**
 * Server-side API route for smart contract code generation.
 * Uses MISTRAL_API_KEY (server-only) — never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt, userPrompt } = body;

    if (!userPrompt) {
      return NextResponse.json({ error: 'userPrompt is required' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Mistral API error', details: err }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Contract generation error:', error);
    return NextResponse.json({ error: 'Contract generation failed', details: error?.message }, { status: 500 });
  }
}
