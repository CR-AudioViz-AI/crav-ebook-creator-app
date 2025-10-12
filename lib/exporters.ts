import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export type Chapter = { title: string; contentMd: string };
export type Manuscript = {
  title: string;
  subtitle?: string;
  author: string;
  description: string;
  chapters: Chapter[];
};

export async function toPDF(manuscript: Manuscript): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const addText = (text: string, size: number, isBold = false, spacing = 4) => {
    const textFont = isBold ? boldFont : font;
    const lines = wrapText(text, 90);

    for (const line of lines) {
      if (y < margin + 20) {
        page = pdfDoc.addPage();
        y = height - margin;
      }

      page.drawText(line, {
        x: margin,
        y,
        size,
        font: textFont,
        color: rgb(0, 0, 0),
      });

      y -= size + spacing;
    }
  };

  addText(manuscript.title, 24, true, 8);
  if (manuscript.subtitle) {
    addText(manuscript.subtitle, 16, false, 6);
  }
  addText(`by ${manuscript.author}`, 12, false, 4);
  y -= 20;

  if (manuscript.description) {
    addText(manuscript.description, 11, false, 4);
    y -= 20;
  }

  for (const chapter of manuscript.chapters) {
    y -= 12;
    if (y < margin + 40) {
      page = pdfDoc.addPage();
      y = height - margin;
    }

    addText(chapter.title, 18, true, 6);
    y -= 8;
    addText(chapter.contentMd, 11, false, 4);
    y -= 16;
  }

  return await pdfDoc.save();
}

export async function toEPUB(manuscript: Manuscript): Promise<Buffer> {
  let html = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeHtml(manuscript.title)}</title>
  <style>
    body { font-family: serif; line-height: 1.6; padding: 2em; }
    h1 { font-size: 2em; margin-top: 1em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(manuscript.title)}</h1>
  ${manuscript.subtitle ? `<h2>${escapeHtml(manuscript.subtitle)}</h2>` : ''}
  <p><em>by ${escapeHtml(manuscript.author)}</em></p>
  <p>${escapeHtml(manuscript.description)}</p>
`;

  for (const chapter of manuscript.chapters) {
    html += `
  <h2>${escapeHtml(chapter.title)}</h2>
  <div>${markdownToHtml(chapter.contentMd)}</div>
`;
  }

  html += `
</body>
</html>`;

  return Buffer.from(html, 'utf-8');
}

export async function toDOCX(manuscript: Manuscript): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: manuscript.title,
      heading: HeadingLevel.TITLE,
    })
  );

  if (manuscript.subtitle) {
    children.push(
      new Paragraph({
        text: manuscript.subtitle,
        heading: HeadingLevel.HEADING_2,
      })
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `by ${manuscript.author}`, italics: true })],
    })
  );

  if (manuscript.description) {
    children.push(
      new Paragraph({
        text: manuscript.description,
      })
    );
  }

  children.push(new Paragraph({ text: '' }));

  for (const chapter of manuscript.chapters) {
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
      })
    );

    const paragraphs = chapter.contentMd.split('\n\n');
    for (const para of paragraphs) {
      if (para.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun(para.trim())],
          })
        );
      }
    }

    children.push(new Paragraph({ text: '' }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(md: string): string {
  return md
    .split('\n\n')
    .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
    .join('\n');
}
