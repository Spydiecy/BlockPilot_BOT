import { jsPDF } from 'jspdf';

interface AuditResult {
  stars: number;
  summary: string;
  vulnerabilities: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  recommendations: string[];
  gasOptimizations: string[];
}

// A4 in pt
const PW = 595.28;
const PH = 841.89;
const ML = 44;
const MR = 44;
const CW = PW - ML - MR; // 507.28
const FOOTER_H = 22;

// Line height: jsPDF default lineHeightFactor = 1.15
const lh = (fs: number) => fs * 1.15;

// Load favicon.ico via canvas → PNG data URL
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Use a square canvas sized to the image (favicons are usually 32–64px)
        const size = Math.max(img.naturalWidth || 32, img.naturalHeight || 32);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = '/favicon.ico?' + Date.now(); // bust cache
    });
  } catch {
    return null;
  }
}

export async function generateAuditPDF(
  result: AuditResult,
  contractCode?: string,
  txHash?: string | null
) {
  const logoDataUrl = await loadLogoDataUrl();

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 0;

  // ── page-break guard ──────────────────────────────────────────────
  const guard = (needed: number) => {
    if (y + needed > PH - FOOTER_H - 10) {
      addFooter();
      doc.addPage();
      y = 44;
    }
  };

  // ── footer ────────────────────────────────────────────────────────
  const addFooter = () => {
    const pg = doc.getNumberOfPages();
    doc.setFillColor(10, 14, 28);
    doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 110, 150);
    doc.text(
      'BlockPilot  ·  Polygon Network  ·  AI-Powered Smart Contract Security',
      ML, PH - 7
    );
    doc.text(`Page ${pg}`, PW - MR, PH - 7, { align: 'right' });
  };

  // ── section bar ───────────────────────────────────────────────────
  // NOTE: y += 30 so content top never overlaps the 17-pt bar
  const section = (title: string) => {
    guard(32);
    doc.setFillColor(12, 18, 36);
    doc.rect(ML, y, CW, 17, 'F');
    doc.setFillColor(99, 102, 241); // purple left accent
    doc.rect(ML, y, 3, 17, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 190, 255);
    doc.text(title, ML + 10, y + 11.5);
    y += 30; // bar(17) + gap(13) → content top clears bar bottom
  };

  // ── draw filled 5-point star ──────────────────────────────────────
  const drawStar = (cx: number, cy: number, r: number, filled: boolean) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : r * 0.42;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    const rel: [number, number][] = pts
      .slice(1)
      .map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    if (filled) {
      doc.setFillColor(250, 204, 21);
      doc.setDrawColor(220, 170, 10);
    } else {
      doc.setFillColor(42, 44, 58);
      doc.setDrawColor(100, 105, 120);
    }
    doc.setLineWidth(0.5);
    doc.lines(rel, pts[0][0], pts[0][1], [1, 1], filled ? 'FD' : 'FD', true);
  };

  // ── fallback drawn lightning-bolt logo ────────────────────────────
  const drawBoltLogo = (x: number, midY: number) => {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(x, midY - 14, 20, 20, 3, 3, 'F');
    // bolt: white filled polygon
    const bolt: [number, number][] = [
      [x + 13, midY - 12],
      [x + 7,  midY - 4],
      [x + 11, midY - 4],
      [x + 7,  midY + 5],
      [x + 14, midY - 3],
      [x + 10, midY - 3],
    ];
    const bRel: [number, number][] = bolt
      .slice(1)
      .map((p, i) => [p[0] - bolt[i][0], p[1] - bolt[i][1]]);
    doc.setFillColor(255, 255, 255);
    doc.lines(bRel, bolt[0][0], bolt[0][1], [1, 1], 'F', true);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    doc.text('BlockPilot', x + 26, midY + 5);
  };

  // ════════════════════════════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════════════════════════════
  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, PW, 82, 'F');
  // top accent bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, PW, 3, 'F');

  // Logo — favicon.ico if loaded, else drawn bolt
  if (logoDataUrl) {
    // draw favicon square (40×40) then BlockPilot text
    doc.addImage(logoDataUrl, 'PNG', ML, 16, 42, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('BlockPilot', ML + 50, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 110, 145);
    doc.text('Smart Contract Security Report', ML + 50, 57);
  } else {
    drawBoltLogo(ML, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 110, 145);
    doc.text('Smart Contract Security Report', ML + 26, 60);
  }

  // right-side meta
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 175);
  doc.text(dateStr, PW - MR, 36, { align: 'right' });
  doc.text('Polygon Amoy Network', PW - MR, 50, { align: 'right' });

  // bottom separator
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1);
  doc.line(0, 82, PW, 82);

  y = 104;

  // ════════════════════════════════════════════════════════════════
  // SECURITY SCORE
  // ════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(105, 115, 135);
  doc.text('SECURITY SCORE', ML, y);
  y += lh(8) + 6;

  // 5 drawn stars
  const starR = 8;
  for (let i = 0; i < 5; i++) {
    drawStar(ML + starR + i * (starR * 2 + 4), y, starR, i < result.stars);
  }

  // score badge — right side, vertically centred on the star row
  const badgeRGB = getBadgeColor(result.stars);
  doc.setFillColor(...badgeRGB);
  doc.roundedRect(PW - MR - 68, y - starR - 2, 68, 32, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${result.stars}/5`, PW - MR - 34, y + 7, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('SECURITY STARS', PW - MR - 34, y + 17, { align: 'center' });

  y += starR * 2 + 8; // past star row

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(95, 100, 118);
  doc.text(getScoreLabel(result.stars), ML, y);
  y += lh(8.5) + 12;

  // divider
  doc.setDrawColor(210, 215, 230);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 14;

  // ════════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════════
  section('EXECUTIVE SUMMARY');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(42, 46, 58);
  const sumLines = doc.splitTextToSize(result.summary, CW) as string[];
  guard(sumLines.length * lh(9.5) + 12);
  doc.text(sumLines, ML, y);
  y += sumLines.length * lh(9.5) + 14;

  // ════════════════════════════════════════════════════════════════
  // VULNERABILITY COUNT BOXES
  // ════════════════════════════════════════════════════════════════
  const counts: { label: string; value: number; rgb: [number, number, number] }[] = [
    { label: 'Critical', value: result.vulnerabilities.critical.length, rgb: [220, 38, 38] },
    { label: 'High',     value: result.vulnerabilities.high.length,     rgb: [234, 88, 12] },
    { label: 'Medium',   value: result.vulnerabilities.medium.length,   rgb: [202, 138, 4] },
    { label: 'Low',      value: result.vulnerabilities.low.length,      rgb: [37, 99, 235] },
  ];

  guard(52);
  const bw = (CW - 12) / 4;
  counts.forEach(({ label, value, rgb }, i) => {
    const bx = ML + i * (bw + 4);
    // white card background
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(bx, y, bw, 42, 3, 3, 'F');
    // colored top strip (5pt)
    doc.setFillColor(...rgb);
    doc.roundedRect(bx, y, bw, 5, 2, 2, 'F');
    // colored border
    doc.setDrawColor(...rgb);
    doc.setLineWidth(1);
    doc.roundedRect(bx, y, bw, 42, 3, 3, 'S');
    // count
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...rgb);
    doc.text(String(value), bx + bw / 2, y + 27, { align: 'center' });
    // label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(70, 76, 90);
    doc.text(label.toUpperCase(), bx + bw / 2, y + 38, { align: 'center' });
  });
  y += 54;

  // ════════════════════════════════════════════════════════════════
  // VULNERABILITIES
  // ════════════════════════════════════════════════════════════════
  y += 10;
  section('VULNERABILITIES DETECTED');

  const totalV = Object.values(result.vulnerabilities).flat().length;
  if (totalV === 0) {
    guard(lh(9.5) + 8);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(22, 163, 74);
    doc.text(
      'No vulnerabilities detected. Contract follows security best practices.',
      ML, y
    );
    y += lh(9.5) + 10;
  } else {
    const sevs: { key: keyof AuditResult['vulnerabilities']; label: string; rgb: [number, number, number] }[] = [
      { key: 'critical', label: 'CRITICAL',    rgb: [220, 38, 38] },
      { key: 'high',     label: 'HIGH RISK',   rgb: [234, 88, 12] },
      { key: 'medium',   label: 'MEDIUM RISK', rgb: [202, 138, 4] },
      { key: 'low',      label: 'LOW RISK',    rgb: [37, 99, 235] },
    ];
    for (const { key, label, rgb } of sevs) {
      const issues = result.vulnerabilities[key];
      if (!issues.length) continue;

      guard(22 + issues.length * (lh(9) * 2 + 4) + 8);

      // severity pill (13pt tall)
      doc.setFillColor(...rgb);
      doc.roundedRect(ML, y, 74, 13, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(label, ML + 37, y + 9, { align: 'center' });

      // NOTE: y += 22 so text ascender (9pt → ~6.3pt) clears pill bottom (13pt)
      y += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(38, 42, 54);
      for (const issue of issues) {
        const ls = doc.splitTextToSize(`\u2022  ${issue}`, CW - 16) as string[];
        guard(ls.length * lh(9) + 4);
        doc.text(ls, ML + 8, y);
        y += ls.length * lh(9) + 4;
      }
      y += 8;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════
  y += 6;
  section('RECOMMENDATIONS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(38, 42, 54);
  result.recommendations.forEach((rec, i) => {
    const ls = doc.splitTextToSize(`${i + 1}.  ${rec}`, CW - 8) as string[];
    guard(ls.length * lh(9) + 6);
    doc.text(ls, ML + 4, y);
    y += ls.length * lh(9) + 6;
  });

  // ════════════════════════════════════════════════════════════════
  // GAS OPTIMIZATIONS
  // ════════════════════════════════════════════════════════════════
  y += 8;
  section('GAS OPTIMIZATIONS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(38, 42, 54);
  result.gasOptimizations.forEach((opt, i) => {
    const ls = doc.splitTextToSize(`${i + 1}.  ${opt}`, CW - 8) as string[];
    guard(ls.length * lh(9) + 6);
    doc.text(ls, ML + 4, y);
    y += ls.length * lh(9) + 6;
  });

  // ════════════════════════════════════════════════════════════════
  // CONTRACT SNIPPET
  // ════════════════════════════════════════════════════════════════
  if (contractCode && contractCode.trim()) {
    const rawLines = contractCode.split('\n');
    const codeRaw = rawLines.slice(0, 25).join('\n')
      + (rawLines.length > 25 ? '\n// ... (truncated)' : '');

    y += 8;
    section('CONTRACT SNIPPET  (FIRST 25 LINES)');

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    const codeLines = doc.splitTextToSize(codeRaw, CW - 22) as string[];
    const blockH = codeLines.length * lh(7.5) + 18;
    guard(blockH + 6);

    doc.setFillColor(10, 15, 32);
    doc.roundedRect(ML, y, CW, blockH, 4, 4, 'F');
    doc.setTextColor(135, 205, 135);
    doc.text(codeLines, ML + 10, y + lh(7.5) + 4);
    y += blockH + 12;
  }

  // ════════════════════════════════════════════════════════════════
  // ON-CHAIN VERIFICATION
  // ════════════════════════════════════════════════════════════════
  if (txHash) {
    y += 8;
    section('ON-CHAIN VERIFICATION');

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    const txLines = doc.splitTextToSize(txHash, CW - 24) as string[];
    const urlStr = `https://amoy.polygonscan.com/tx/${txHash}`;
    const urlLines = doc.splitTextToSize(urlStr, CW - 24) as string[];

    const boxH = lh(9) + lh(8) + txLines.length * lh(7.5) + urlLines.length * lh(7.5) + 30;
    guard(boxH + 6);

    doc.setFillColor(238, 253, 242);
    doc.roundedRect(ML, y, CW, boxH, 4, 4, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.8);
    doc.roundedRect(ML, y, CW, boxH, 4, 4, 'S');
    doc.setFillColor(22, 163, 74);
    doc.roundedRect(ML, y, 4, boxH, 2, 2, 'F'); // green left bar

    let ty = y + 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 150, 68);
    doc.text('Audit Registered On-Chain', ML + 12, ty);
    ty += lh(9) + 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(52, 56, 68);
    doc.text('Transaction Hash:', ML + 12, ty);
    ty += lh(8) + 3;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(88, 28, 135);
    doc.text(txLines, ML + 12, ty);
    ty += txLines.length * lh(7.5) + 6;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    doc.text(urlLines, ML + 12, ty);

    y += boxH + 12;
  }

  // ════════════════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════════════════
  addFooter();

  doc.save(`blockpilot-audit-${new Date().toISOString().split('T')[0]}.pdf`);
}

function getScoreLabel(stars: number): string {
  if (stars === 5) return 'Excellent — No Issues Found';
  if (stars === 4) return 'Good — Minor Issues Only';
  if (stars === 3) return 'Fair — Needs Attention';
  if (stars === 2) return 'Poor — Critical Issues Present';
  if (stars === 1) return 'Dangerous — Major Vulnerabilities';
  return 'Critical Risk — Unsafe to Deploy';
}

function getBadgeColor(stars: number): [number, number, number] {
  if (stars >= 4) return [22, 163, 74];
  if (stars === 3) return [202, 138, 4];
  if (stars === 2) return [234, 88, 12];
  return [220, 38, 38];
}
