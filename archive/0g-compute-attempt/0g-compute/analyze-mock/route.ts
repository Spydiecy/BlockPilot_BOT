// src/app/api/0g-compute/analyze-mock/route.ts
// Mock endpoint for demo purposes when testnet tokens are insufficient

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

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock analysis based on contract code patterns
    const hasPayable = contractCode.includes('payable');
    const hasTransfer = contractCode.includes('transfer') || contractCode.includes('.call');
    const hasOnlyOwner = contractCode.includes('onlyOwner') || contractCode.includes('owner');
    const hasReentrancy = contractCode.includes('call{value:') && !contractCode.includes('ReentrancyGuard');

    const vulnerabilities = {
      critical: [] as string[],
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[],
    };

    if (hasReentrancy) {
      vulnerabilities.critical.push('Potential reentrancy vulnerability detected in external call');
    }

    if (hasTransfer && !hasOnlyOwner) {
      vulnerabilities.high.push('Unrestricted fund transfer function without access control');
    }

    if (hasPayable && !contractCode.includes('require')) {
      vulnerabilities.medium.push('Payable function without input validation');
    }

    if (!contractCode.includes('pragma solidity')) {
      vulnerabilities.low.push('Missing Solidity version pragma');
    }

    if (!contractCode.includes('SPDX-License-Identifier')) {
      vulnerabilities.low.push('Missing SPDX license identifier');
    }

    const totalIssues = 
      vulnerabilities.critical.length + 
      vulnerabilities.high.length + 
      vulnerabilities.medium.length + 
      vulnerabilities.low.length;

    const stars = totalIssues === 0 ? 5 : 
                  totalIssues <= 2 ? 4 : 
                  totalIssues <= 4 ? 3 : 
                  totalIssues <= 6 ? 2 : 1;

    const analysis = {
      summary: `Security analysis complete. Found ${totalIssues} potential issue(s). ${
        vulnerabilities.critical.length > 0 ? 'CRITICAL issues require immediate attention.' : 
        vulnerabilities.high.length > 0 ? 'High severity issues detected.' :
        'No critical issues found.'
      }`,
      vulnerabilities,
      recommendations: [
        ...(hasReentrancy ? ['Implement ReentrancyGuard from OpenZeppelin'] : []),
        ...(hasTransfer && !hasOnlyOwner ? ['Add access control modifiers to sensitive functions'] : []),
        ...(hasPayable ? ['Add input validation with require statements'] : []),
        'Follow Checks-Effects-Interactions pattern',
        'Consider using SafeMath for arithmetic operations',
        'Add comprehensive event logging',
      ],
      gasOptimizations: [
        'Cache array length in loops',
        'Use calldata instead of memory for read-only function parameters',
        'Pack storage variables to save gas',
        'Use uint256 instead of smaller uints when possible',
      ],
      stars,
    };

    return NextResponse.json({
      success: true,
      jobId: '0x' + crypto.randomUUID().replace(/-/g, ''),
      provider: '0xa48f01287233509FD694a22Bf840225062E67836',
      model: 'qwen-2.5-7b-instruct (mock)',
      analysis,
      timestamp: Date.now(),
      message: '⚠️ MOCK DATA - Real 0G Compute integration ready, awaiting testnet tokens',
      isMock: true,
    });

  } catch (error: any) {
    console.error('Mock analysis error:', error);
    return NextResponse.json(
      {
        error: 'Mock analysis failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
