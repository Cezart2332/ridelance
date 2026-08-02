/**
 * Verificări făcute pe fișier ÎNAINTE de upload, ca driverul să afle imediat că poza nu e bună —
 * nu după ce a așteptat uploadul și prevalidarea automată.
 *
 * Mesajele sunt concrete și spun ce să facă („încearcă la lumină”), nu „Fișier invalid”.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

/** Sub asta textul dintr-un act nu mai e lizibil pentru OCR. */
const MIN_LONG_EDGE_PX = 1000
/** Luminanță medie 0–255. Sub prag, pozele de buletin ies necitibile. */
const MIN_MEAN_LUMINANCE = 42

export interface UploadIssue {
  file: File
  message: string
}

const isPdf = (file: File) => file.type === 'application/pdf'

/** Luminanța medie a imaginii, eșantionată pe un canvas mic — suficient și ieftin. */
async function meanLuminance(bitmap: ImageBitmap): Promise<number | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(bitmap, 0, 0, 32, 32)
  const { data } = ctx.getImageData(0, 0, 32, 32)

  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    // Coeficienți de luminanță percepută (Rec. 601).
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return total / (data.length / 4)
}

/** Prima problemă găsită la un fișier, sau `null` dacă e în regulă. */
export async function validateUploadFile(file: File): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Acceptăm doar PDF, JPG sau PNG. Fă o poză cu telefonul sau exportă documentul în PDF.'
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Documentul depășește 10 MB. Încarcă mai puține imagini sau imagini mai mici.'
  }

  if (isPdf(file)) {
    return null
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Nu blocăm uploadul pentru o verificare care nu s-a putut face — backendul rămâne plasa de siguranță.
    return null
  }

  try {
    if (Math.max(bitmap.width, bitmap.height) < MIN_LONG_EDGE_PX) {
      return 'Poza e prea mică — textul nu se va putea citi. Fotografiază documentul de mai aproape.'
    }

    const luminance = await meanLuminance(bitmap)
    if (luminance !== null && luminance < MIN_MEAN_LUMINANCE) {
      return 'Poza e prea întunecată, încearcă la lumină.'
    }
  } finally {
    bitmap.close()
  }

  return null
}

/** Validează toate fișierele selectate și întoarce doar problemele. */
export async function validateUploadFiles(files: File[]): Promise<UploadIssue[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      const message = await validateUploadFile(file)
      return message ? { file, message } : null
    }),
  )
  return results.filter((issue): issue is UploadIssue => issue !== null)
}
