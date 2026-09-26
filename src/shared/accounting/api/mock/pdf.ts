/**
 * PDF-uri simulate pentru mock (documentul original, PDF-ul „DUKIntegrator”, exporturile de
 * registre), cu text layer real, ca ecranul de verificare din F2 să poată căuta fragmentele sursă.
 *
 * `jspdf` se încarcă la cerere, ca în `utils/imagesToPdf.ts`. Fonturile lui standard au doar
 * WinAnsi: ă, ș, ț își pierd diacriticul în PDF (restul, inclusiv „Ü” din „Bolt Operations OÜ”, rămâne).
 */

function toWinAnsi(text: string): string {
  return [...text]
    .map((char) => {
      if (char.charCodeAt(0) <= 0xff || char === '–' || char === '—' || char === '€') return char
      const stripped = char.normalize('NFD').replace(/[̀-̧̦ͯ]/g, '')
      return stripped.length === 1 && stripped.charCodeAt(0) <= 0xff ? stripped : '?'
    })
    .join('')
}

export async function textPdf(title: string, lines: string[], footer?: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageHeight = doc.internal.pageSize.getHeight()
  const width = doc.internal.pageSize.getWidth() - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(toWinAnsi(title), margin, y)
  y += 28

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  for (const line of lines) {
    for (const wrapped of doc.splitTextToSize(toWinAnsi(line), width) as string[]) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wrapped, margin, y)
      y += 16
    }
  }

  if (footer) {
    doc.setFontSize(8)
    doc.text(toWinAnsi(footer), margin, pageHeight - margin / 2)
  }
  return doc.output('blob')
}

/** Exportul „Excel” al mock-ului e CSV (separator `;`, ca Excel-ul românesc). ClosedXML vine în B7. */
export function csvBlob(header: string[], rows: (string | number)[][]): Blob {
  const escape = (value: string | number) => {
    const text = String(value)
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const content = [header, ...rows].map((row) => row.map(escape).join(';')).join('\r\n')
  // BOM-ul face ca Excel să citească fișierul ca UTF-8 (diacriticele).
  return new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
}
