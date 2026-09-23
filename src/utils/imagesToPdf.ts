/**
 * Combină mai multe imagini (față/verso, pagini fotografiate) într-un singur
 * fișier PDF, ca un document să rămână un singur fișier pentru backend,
 * verificarea AI și admin. Imaginile sunt redimensionate și recomprimate JPEG
 * ca PDF-ul rezultat să rămână sub limita de upload.
 */

const MAX_DIMENSION_PX = 2200
const JPEG_QUALITY = 0.85

async function toJpegPage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponibil')
    ctx.drawImage(bitmap, 0, 0, width, height)

    return { dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), width, height }
  } finally {
    bitmap.close()
  }
}

/** A4 în milimetri, plus o margine care ține imaginea departe de marginea tăiată la print. */
const A4_MM = { width: 210, height: 297 } as const
const MARGIN_MM = 10

export async function imagesToPdfFile(images: File[], baseName: string): Promise<File> {
  const { jsPDF } = await import('jspdf')

  let doc: InstanceType<typeof jsPDF> | null = null
  for (const image of images) {
    const page = await toJpegPage(image)

    // Pagina rămâne A4, orientată după raportul imaginii. Înainte formatul era chiar dimensiunea
    // în pixeli a pozei (`format: [width, height]`, unit `px`), ceea ce producea pagini de ~580mm:
    // lipite în dosarul A4, ele erau exact „pozele care ies din pagină".
    const landscape = page.width > page.height
    const pageWidth = landscape ? A4_MM.height : A4_MM.width
    const pageHeight = landscape ? A4_MM.width : A4_MM.height
    const orientation = landscape ? 'l' : 'p'

    if (doc === null) {
      doc = new jsPDF({ unit: 'mm', format: 'a4', orientation })
    } else {
      doc.addPage('a4', orientation)
    }

    // Încadrare cu păstrarea raportului, centrat: nicio axă nu depășește caseta utilă.
    const boxWidth = pageWidth - MARGIN_MM * 2
    const boxHeight = pageHeight - MARGIN_MM * 2
    const scale = Math.min(boxWidth / page.width, boxHeight / page.height)
    const drawWidth = page.width * scale
    const drawHeight = page.height * scale

    doc.addImage(
      page.dataUrl,
      'JPEG',
      MARGIN_MM + (boxWidth - drawWidth) / 2,
      MARGIN_MM + (boxHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )
  }
  if (doc === null) throw new Error('Nicio imagine selectată')

  const blob = doc.output('blob')
  const safeName = baseName.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'document'
  return new File([blob], `${safeName}.pdf`, { type: 'application/pdf' })
}

/** Peste atâta, o poză se recomprimă înainte de upload. */
const LARGE_PHOTO_BYTES = 6 * 1024 * 1024
const LARGE_PHOTO_MAX_DIMENSION_PX = 3000

/**
 * O poză de telefon trece ușor de 10–15 MB. Recomprimată la 3000 px pe latura mare, un act rămâne
 * perfect lizibil pe o pagină A4 și pleacă de câteva ori mai repede. PDF-urile și pozele mici merg
 * ca atare. `createImageBitmap` aplică orientarea din EXIF, deci poza iese dreaptă.
 *
 * La orice eroare (format necunoscut browserului, memorie) pleacă originalul: limita serverului
 * rămâne ultima plasă.
 */
export async function compressLargePhoto(file: File): Promise<File> {
  const isPhoto = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isPhoto || file.size <= LARGE_PHOTO_BYTES) return file
  return (await reencodeAsJpeg(file, LARGE_PHOTO_MAX_DIMENSION_PX, true)) ?? file
}

/** Peste atâta, o poză din chat se micșorează, ca să apară repede în conversație. */
const CHAT_PHOTO_BYTES = 1.5 * 1024 * 1024
const CHAT_PHOTO_MAX_DIMENSION_PX = 2560

export function isHeic(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

/**
 * Poza trimisă în chat, pregătită să se vadă direct în conversație, ca pe WhatsApp: pozele HEIC
 * de pe iPhone devin JPEG (altfel browserul nu le poate afișa), iar cele mari se micșorează la
 * 2560 px. Dacă browserul nu poate citi poza, pleacă originalul — apare atunci ca fișier.
 */
export async function prepareChatPhoto(file: File): Promise<File> {
  // GIF-urile rămân așa (s-ar pierde animația); orice alt format de poză (HEIC, BMP, TIFF, AVIF) devine JPEG.
  if (file.type === 'image/gif') return file
  const displayable = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
  if (isHeic(file) || (file.type.startsWith('image/') && !displayable)) {
    return (await reencodeAsJpeg(file, CHAT_PHOTO_MAX_DIMENSION_PX, false)) ?? file
  }
  if (!displayable || file.size <= CHAT_PHOTO_BYTES) return file
  return (await reencodeAsJpeg(file, CHAT_PHOTO_MAX_DIMENSION_PX, true)) ?? file
}

/**
 * Recodează o poză ca JPEG, cu latura mare de cel mult `maxDimension`. `null` la orice eroare
 * sau, cu `onlyIfSmaller`, când rezultatul n-ar fi mai mic decât originalul.
 */
async function reencodeAsJpeg(file: File, maxDimension: number, onlyIfSmaller: boolean): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file)
    try {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
      if (!blob || (onlyIfSmaller && blob.size >= file.size)) return null

      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
      return new File([blob], name, { type: 'image/jpeg' })
    } finally {
      bitmap.close()
    }
  } catch {
    return null
  }
}

/**
 * Pregătește fișierul final de upload: un singur fișier merge ca atare,
 * mai multe imagini sunt combinate într-un PDF.
 */
export async function buildUploadFile(files: File[], baseName: string): Promise<File> {
  if (files.length === 0) throw new Error('Niciun fișier selectat')
  if (files.length === 1) return compressLargePhoto(files[0])
  return imagesToPdfFile(files, baseName)
}
