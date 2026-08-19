import { jsPDF } from 'jspdf';

interface Parameter {
  name: string;
  type: string;
  description?: string;
  indexed?: boolean;
}

interface Function {
  name: string;
  description: string;
  params: Parameter[];
  visibility: string;
}

interface Event {
  name: string;
  description: string;
  params: Parameter[];
}

interface Variable {
  name: string;
  type: string;
  visibility: string;
  description: string;
}

interface Documentation {
  name: string;
  description: string;
  version: string;
  license: string;
  functions?: Function[];
  events?: Event[];
  variables?: Variable[];
}

// A4 dimensions in points
const PW = 595.28;
const PH = 841.89;
const ML = 44;
const MR = 44;
const CW = PW - ML - MR;
const FOOTER_H = 22;

// Line height helper
const lh = (fs: number) => fs * 1.15;

// Load favicon.ico as logo
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.max(img.naturalWidth || 32, img.naturalHeight || 32);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no ctx')); return; }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = '/favicon.ico?' + Date.now();
    });
  } catch {
    return null;
  }
}

export const generateDocumentationPDF = async (
  documentation: Documentation,
  purpose: string,
  recipientInfo?: string
) => {
  const logoDataUrl = await loadLogoDataUrl();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 0;

  // Page break guard
  const guard = (needed: number) => {
    if (y + needed > PH - FOOTER_H - 10) {
      addFooter();
      doc.addPage();
      y = 44;
    }
  };

  // Footer
  const addFooter = () => {
    const pg = doc.getNumberOfPages();
    doc.setFillColor(10, 14, 28);
    doc.rect(0, PH - FOOTER_H, PW, FOOTER_H, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 110, 150);
    doc.text(
      'BlockPilot  ·  BOT Chain  ·  Smart Contract Documentation',
      ML, PH - 7
    );
    doc.text(`Page ${pg}`, PW - MR, PH - 7, { align: 'right' });
  };

  // Section bar
  const section = (title: string) => {
    guard(32);
    doc.setFillColor(12, 18, 36);
    doc.rect(ML, y, CW, 17, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(ML, y, 3, 17, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 190, 255);
    doc.text(title, ML + 10, y + 11.5);
    y += 30;
  };

  // Fallback drawn logo
  const drawBoltLogo = (x: number, midY: number) => {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(x, midY - 14, 20, 20, 3, 3, 'F');
    const bolt: [number, number][] = [
      [x + 13, midY - 12], [x + 7, midY - 4], [x + 11, midY - 4],
      [x + 7, midY + 5], [x + 14, midY - 3], [x + 10, midY - 3],
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

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, PW, 82, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, PW, 3, 'F');

  // Logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', ML, 16, 42, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('BlockPilot', ML + 50, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 110, 145);
    doc.text('Smart Contract Documentation', ML + 50, 57);
  } else {
    drawBoltLogo(ML, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 110, 145);
    doc.text('Smart Contract Documentation', ML + 26, 60);
  }

  // Right-side meta
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 175);
  doc.text(dateStr, PW - MR, 36, { align: 'right' });
  doc.text('BOT Chain', PW - MR, 50, { align: 'right' });

  // Bottom separator
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(1);
  doc.line(0, 82, PW, 82);

  y = 104;

  // ═══════════════════════════════════════════════════════════════
  // DOCUMENT INFORMATION
  // ═══════════════════════════════════════════════════════════════
  section('DOCUMENT INFORMATION');

  const infoItems = [
    { label: 'Purpose', value: purpose },
    ...(recipientInfo ? [{ label: 'For', value: recipientInfo }] : []),
    { label: 'Generated', value: new Date().toLocaleString() },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  infoItems.forEach(({ label, value }) => {
    guard(lh(9) + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 80, 100);
    doc.text(`${label}:`, ML, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(42, 46, 58);
    const valueLines = doc.splitTextToSize(value, CW - 80) as string[];
    doc.text(valueLines, ML + 75, y);
    y += Math.max(lh(9), valueLines.length * lh(9)) + 4;
  });

  y += 10;
  doc.setDrawColor(210, 215, 230);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 14;

  // ═══════════════════════════════════════════════════════════════
  // CONTRACT OVERVIEW
  // ═══════════════════════════════════════════════════════════════
  section('CONTRACT OVERVIEW');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(documentation.name, ML, y);
  y += lh(14) + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(42, 46, 58);
  const descLines = doc.splitTextToSize(documentation.description, CW) as string[];
  guard(descLines.length * lh(9.5) + 12);
  doc.text(descLines, ML, y);
  y += descLines.length * lh(9.5) + 8;

  // Version and License badges
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(ML, y, 70, 18, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('VERSION', ML + 35, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(documentation.version, ML + 35, y + 15, { align: 'center' });

  doc.roundedRect(ML + 75, y, 70, 18, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('LICENSE', ML + 110, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(documentation.license, ML + 110, y + 15, { align: 'center' });

  y += 28;

  // ═══════════════════════════════════════════════════════════════
  // FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  if (documentation.functions && documentation.functions.length > 0) {
    y += 10;
    section('FUNCTIONS');

    documentation.functions.forEach((func) => {
      // Calculate content first to determine card height
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      
      const funcDescLines = doc.splitTextToSize(func.description, CW - 20) as string[];
      
      let paramHeight = 0;
      if (func.params && func.params.length > 0) {
        paramHeight = lh(8) + 4; // "Parameters:" label
        func.params.forEach((param) => {
          const paramText = `• ${param.name} (${param.type})${param.description ? ' - ' + param.description : ''}`;
          const paramLines = doc.splitTextToSize(paramText, CW - 28) as string[];
          paramHeight += paramLines.length * lh(8) + 2;
        });
      }
      
      const cardHeight = 28 + funcDescLines.length * lh(9) + 8 + paramHeight + 8;
      guard(cardHeight + 10);

      const cardY = y;
      
      // Draw background
      doc.setFillColor(248, 249, 252);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.roundedRect(ML, cardY, CW, cardHeight, 4, 4, 'FD');
      
      // Function name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.text(func.name, ML + 10, cardY + 16);

      // Visibility badge
      const visColors: Record<string, [number, number, number]> = {
        public: [34, 197, 94],
        external: [59, 130, 246],
        internal: [234, 179, 8],
        private: [239, 68, 68],
      };
      const visColor = visColors[func.visibility] || [107, 114, 128];
      doc.setFillColor(...visColor);
      doc.roundedRect(PW - MR - 65, cardY + 8, 55, 14, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(func.visibility.toUpperCase(), PW - MR - 37.5, cardY + 17, { align: 'center' });

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(funcDescLines, ML + 10, cardY + 30);
      
      let currentY = cardY + 30 + funcDescLines.length * lh(9) + 6;

      // Parameters
      if (func.params && func.params.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text('Parameters:', ML + 10, currentY);
        currentY += lh(8) + 4;

        func.params.forEach((param) => {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(37, 99, 235);
          const paramText = `• ${param.name} (${param.type})${param.description ? ' - ' + param.description : ''}`;
          const paramLines = doc.splitTextToSize(paramText, CW - 28) as string[];
          doc.text(paramLines, ML + 14, currentY);
          currentY += paramLines.length * lh(8) + 2;
        });
      }

      y = cardY + cardHeight + 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════
  if (documentation.events && documentation.events.length > 0) {
    y += 10;
    section('EVENTS');

    documentation.events.forEach((event) => {
      // Calculate content first
      const eventDescLines = doc.splitTextToSize(event.description, CW - 20) as string[];
      
      let paramHeight = 0;
      if (event.params && event.params.length > 0) {
        paramHeight = lh(8) + 4; // "Parameters:" label
        paramHeight += event.params.length * (lh(8) + 2);
      }
      
      const cardHeight = 28 + eventDescLines.length * lh(9) + 8 + paramHeight + 8;
      guard(cardHeight + 10);

      const cardY = y;
      
      // Draw background
      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(250, 204, 21);
      doc.setLineWidth(0.5);
      doc.roundedRect(ML, cardY, CW, cardHeight, 4, 4, 'FD');

      // Event name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(234, 179, 8);
      doc.text(event.name, ML + 10, cardY + 16);

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(eventDescLines, ML + 10, cardY + 30);
      
      let currentY = cardY + 30 + eventDescLines.length * lh(9) + 6;

      // Parameters
      if (event.params && event.params.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text('Parameters:', ML + 10, currentY);
        currentY += lh(8) + 4;

        event.params.forEach((param) => {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(234, 179, 8);
          doc.text(`• ${param.name} (${param.type})`, ML + 14, currentY);
          
          if (param.indexed) {
            const textWidth = doc.getTextWidth(`• ${param.name} (${param.type}) `);
            doc.setFillColor(254, 243, 199);
            doc.setDrawColor(234, 179, 8);
            doc.roundedRect(ML + 14 + textWidth, currentY - 6, 38, 10, 2, 2, 'FD');
            doc.setFontSize(7);
            doc.setTextColor(161, 98, 7);
            doc.text('indexed', ML + 14 + textWidth + 19, currentY, { align: 'center' });
          }
          currentY += lh(8) + 2;
        });
      }

      y = cardY + cardHeight + 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE VARIABLES
  // ═══════════════════════════════════════════════════════════════
  if (documentation.variables && documentation.variables.length > 0) {
    y += 10;
    section('STATE VARIABLES');

    documentation.variables.forEach((variable) => {
      // Calculate content first
      const varDescLines = doc.splitTextToSize(variable.description, CW - 20) as string[];
      const cardHeight = 28 + varDescLines.length * lh(9) + 12;
      guard(cardHeight + 10);

      const cardY = y;
      
      // Draw background
      doc.setFillColor(250, 250, 252);
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.roundedRect(ML, cardY, CW, cardHeight, 4, 4, 'FD');

      // Variable name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(139, 92, 246);
      doc.text(variable.name, ML + 10, cardY + 16);

      // Type and visibility badges
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      
      const typeWidth = doc.getTextWidth(variable.type) + 16;
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(156, 163, 175);
      doc.roundedRect(PW - MR - typeWidth - 65, cardY + 8, typeWidth, 14, 3, 3, 'FD');
      doc.setTextColor(75, 85, 99);
      doc.text(variable.type, PW - MR - typeWidth - 65 + typeWidth / 2, cardY + 17, { align: 'center' });

      doc.setFillColor(219, 234, 254);
      doc.setDrawColor(59, 130, 246);
      doc.roundedRect(PW - MR - 60, cardY + 8, 55, 14, 3, 3, 'FD');
      doc.setTextColor(37, 99, 235);
      doc.text(variable.visibility, PW - MR - 32.5, cardY + 17, { align: 'center' });

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(varDescLines, ML + 10, cardY + 34);

      y = cardY + cardHeight + 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  addFooter();

  const fileName = `${documentation.name.toLowerCase().replace(/\s+/g, '-')}-documentation.pdf`;
  doc.save(fileName);
};
