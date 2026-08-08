/**
 * Server-side API route for test case generation.
 * Uses MISTRAL_API_KEY (server-only) — never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';

const FRAMEWORK_PROMPTS: Record<string, string> = {
  hardhat: `
Additional Requirements:
- Use Hardhat and Chai with latest practices
- Include complete test setup with TypeScript
- Add proper describe/it blocks
- Include deployment scripts
- Add comprehensive assertions
- Include gas usage reporting
Return ONLY the complete test file code without any extra text.`,

  foundry: `
Additional Requirements:
- Use Foundry's Solidity testing framework
- Include setUp() function
- Use forge std assertions
- Add fuzzing where appropriate
- Include proper test annotations
- Add gas optimization tests
Return ONLY the complete test file code without any extra text.`,

  remix: `
Additional Requirements:
- Create step-by-step manual testing instructions
- Include specific input values to test
- Add expected outcomes for each step
- Include verification steps
- Add troubleshooting notes
- Include deployment instructions
Return a structured list of testing steps without any extra text.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractCode, framework } = body;

    if (!contractCode) {
      return NextResponse.json({ error: 'contractCode is required' }, { status: 400 });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    const frameworkPrompt = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS.hardhat;

    const prompt = `You are an expert in smart contract testing. Generate comprehensive test cases for the following smart contract:

Contract code:
${contractCode}

Requirements:
- Test all main contract functions
- Include edge cases and error conditions
- Test access control
- Verify state changes
- Check event emissions
- Add gas optimization checks where relevant
${frameworkPrompt}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Mistral API error', details: err }, { status: response.status });
    }

    const result = await response.json();
    const generatedText = result.choices?.[0]?.message?.content || '';

    const cleanCode = generatedText
      .replace(/```[a-z]*\n/g, '')
      .replace(/```/g, '')
      .replace(/\*/g, '')
      .trim();

    return NextResponse.json({ success: true, testCode: cleanCode });
  } catch (error: any) {
    console.error('Test generation error:', error);
    return NextResponse.json({ error: 'Test generation failed', details: error?.message }, { status: 500 });
  }
}
