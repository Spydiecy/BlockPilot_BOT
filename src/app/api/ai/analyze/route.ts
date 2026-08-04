// src/app/api/ai/analyze/route.ts
// Mistral AI integration for smart contract security analysis

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

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      return NextResponse.json(
        {
          error: 'Mistral API key not configured',
          hint: 'Set MISTRAL_API_KEY in .env.local. Get your key from https://console.mistral.ai',
        },
        { status: 500 }
      );
    }

    // Build comprehensive security audit prompt
    const analysisPrompt = `You are an expert Solidity smart contract security auditor with deep knowledge of common vulnerabilities, best practices, and gas optimization techniques.

Analyze the following Solidity smart contract and provide a comprehensive security audit.

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\`

Provide your analysis in the following JSON format (return ONLY valid JSON, no markdown, no extra text):

{
  "summary": "Brief security summary in 1-2 sentences (max 150 chars)",
  "vulnerabilities": {
    "critical": ["array of critical severity issues with clear descriptions"],
    "high": ["array of high severity issues"],
    "medium": ["array of medium severity issues"],
    "low": ["array of low severity issues and code quality concerns"]
  },
  "recommendations": ["array of 3-5 actionable security recommendations"],
  "gasOptimizations": ["array of 3-5 specific gas optimization suggestions"],
  "stars": 1-5 (integer rating: 5=excellent, 4=good, 3=fair, 2=poor, 1=critical issues)
}

Focus on:
- Reentrancy vulnerabilities
- Access control issues
- Integer overflow/underflow
- Unchecked external calls
- Front-running risks
- Gas optimization opportunities
- Best practice violations

Return ONLY the JSON object, no additional text.`;

    console.log('Calling Mistral AI for contract analysis...');

    // Call Mistral AI API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest', // Using the most capable model
        messages: [
          {
            role: 'system',
            content: 'You are a Solidity security expert. Return analysis as valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, focused output
        max_tokens: 2000,
        response_format: { type: 'json_object' }, // Request JSON response
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral API error:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Mistral API key', details: 'Check your MISTRAL_API_KEY in .env.local' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Mistral AI request failed', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Mistral AI response received');

    // Extract analysis from response
    const analysisText = result.choices?.[0]?.message?.content || '';
    let analysis;

    try {
      // Try to parse the JSON response
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse Mistral response:', analysisText);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          // Fallback to basic analysis
          analysis = {
            summary: 'Analysis completed but response format was unexpected',
            vulnerabilities: { critical: [], high: [], medium: [], low: [] },
            recommendations: ['Review contract manually for security issues'],
            gasOptimizations: [],
            stars: 3,
          };
        }
      } else {
        analysis = {
          summary: analysisText.substring(0, 150),
          vulnerabilities: { critical: [], high: [], medium: [], low: [] },
          recommendations: [],
          gasOptimizations: [],
          stars: 3,
        };
      }
    }

    // Ensure vulnerabilities are arrays of strings, not objects
    if (analysis.vulnerabilities) {
      ['critical', 'high', 'medium', 'low'].forEach(severity => {
        if (Array.isArray(analysis.vulnerabilities[severity])) {
          analysis.vulnerabilities[severity] = analysis.vulnerabilities[severity].map((item: any) => {
            // If item is an object, extract description or convert to string
            if (typeof item === 'object' && item !== null) {
              // Try multiple common fields for vulnerability descriptions
              const description = item.description || item.issue || item.message || item.vulnerability || item.title || item.name;
              if (description && typeof description === 'string') {
                return description;
              }
              // If no string field found, stringify the object
              return JSON.stringify(item);
            }
            // Ensure it's a string
            return typeof item === 'string' ? item : String(item);
          });
        } else {
          analysis.vulnerabilities[severity] = [];
        }
      });
    }
    
    // Ensure recommendations and gasOptimizations are also arrays of strings
    if (Array.isArray(analysis.recommendations)) {
      analysis.recommendations = analysis.recommendations.map((item: any) => 
        typeof item === 'string' ? item : (typeof item === 'object' && item !== null ? (item.description || item.recommendation || JSON.stringify(item)) : String(item))
      );
    }
    if (Array.isArray(analysis.gasOptimizations)) {
      analysis.gasOptimizations = analysis.gasOptimizations.map((item: any) => 
        typeof item === 'string' ? item : (typeof item === 'object' && item !== null ? (item.description || item.optimization || JSON.stringify(item)) : String(item))
      );
    }

    // Validate analysis structure
    if (!analysis.vulnerabilities) {
      analysis.vulnerabilities = { critical: [], high: [], medium: [], low: [] };
    }
    if (!analysis.recommendations) {
      analysis.recommendations = [];
    }
    if (!analysis.gasOptimizations) {
      analysis.gasOptimizations = [];
    }
    if (!analysis.stars || analysis.stars < 1 || analysis.stars > 5) {
      analysis.stars = 3;
    }
    if (!analysis.summary) {
      analysis.summary = 'Security analysis completed';
    }

    // Generate job ID (bytes32 format - 32 bytes = 64 hex chars)
    const uuid = crypto.randomUUID().replace(/-/g, ''); // 32 hex chars (16 bytes)
    const jobId = '0x' + uuid.padEnd(64, '0'); // Pad to 64 hex chars (32 bytes)

    return NextResponse.json({
      success: true,
      jobId,
      model: 'mistral-large-latest',
      provider: 'Mistral AI',
      analysis,
      timestamp: Date.now(),
      message: 'Analysis completed successfully via Mistral AI',
    });

  } catch (error: any) {
    console.error('Unhandled error in AI analysis:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
