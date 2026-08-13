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
- Add comprehensive assertions
- CRITICAL: Always close every function with } before stopping
- CRITICAL: The file must end with the closing } of the main describe block
Return ONLY the complete test file code without any extra text.`,

  foundry: `
Additional Requirements:
- Use Foundry's Solidity testing framework
- Include setUp() function
- Use forge std assertions
- Add fuzzing where appropriate
- CRITICAL: Always close every function with } before stopping
- CRITICAL: The file must end with the closing } of the contract
Return ONLY the complete test file code without any extra text.`,

  remix: `
Additional Requirements:
- Create step-by-step manual testing instructions
- Include specific input values to test
- Add expected outcomes for each step
- Include verification steps
- CRITICAL: Always complete every step fully before stopping
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

    // Keep contract code concise to leave room for test output
    const truncatedCode = contractCode.length > 3000
      ? contractCode.substring(0, 3000) + '\n// ... (truncated for brevity)'
      : contractCode;

    const prompt = `You are an expert in smart contract testing. Generate concise but complete test cases for the following smart contract.

IMPORTANT: Write fewer, higher-quality tests rather than many incomplete ones. Every function you start MUST be fully closed with proper closing braces.

Contract code:
${truncatedCode}

Requirements:
- Test the 5-8 most important functions only
- Include happy path + one error case per function
- Test access control
- Verify key state changes
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
        max_tokens: 3500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Mistral API error', details: err }, { status: response.status });
    }

    const result = await response.json();
    let generatedText: string = result.choices?.[0]?.message?.content || '';

    // Clean markdown artifacts
    let cleanCode = generatedText
      .replace(/```[a-z]*\n?/g, '')
      .replace(/```/g, '')
      .replace(/\*/g, '')
      .trim();

    // Auto-close uncompleted code if truncated mid-function
    // Count opening vs closing braces; if off, append missing closers
    if (framework !== 'remix') {
      const opens = (cleanCode.match(/\{/g) || []).length;
      const closes = (cleanCode.match(/\}/g) || []).length;
      const missing = opens - closes;
      if (missing > 0 && missing <= 5) {
        cleanCode += '\n' + '}'.repeat(missing);
      }
    }

    return NextResponse.json({ success: true, testCode: cleanCode });
  } catch (error: any) {
    console.error('Test generation error:', error);
    return NextResponse.json({ error: 'Test generation failed', details: error?.message }, { status: 500 });
  }
}
