/**
 * Pregătirea imaginilor înainte de upload.
 *
 * Varianta de dinainte refuza o fotografie de 565×353 și îi spunea omului să găsească alta de
 * cel puțin 1600×600. Nimeni nu face asta: ori renunță la fotografie, ori pune prima imagine
 * mare pe care o are la îndemână, indiferent dacă are legătură cu firma. Verificarea apăra
 * calitatea antetului și obținea exact opusul.
 *
 * Acum orice imagine e acceptată și adusă noi la dimensiunea de care are nevoie antetul.
 * Mărirea nu inventează detalii care nu există — o fotografie mică va rămâne mai moale decât una
 * mare — dar diferența dintre „ușor moale" și „lipsește" e toată diferența.
 */

export interface PreparedImage {
  file: File
  /** Ce s-a întâmplat cu imaginea, dacă merită spus. `null` când n-a fost nevoie de nimic. */
  note: string | null
}

/**
 * Antetul se întinde pe toată lățimea ecranului și e tăiat de CSS cu `background-size: cover`,
 * deci nu decupăm noi nimic: doar ne asigurăm că are destui pixeli pentru un ecran mare.
 * Plafonul de sus există ca fișierul să rămână mic — nimeni nu are nevoie de 6000 px lățime
 * într-un fundal.
 */
const COVER = { minWidth: 1920, minHeight: 720, maxWidth: 2560 }

/**
 * Plafon pe suprafață, nu doar pe lățime.
 *
 * Fără el, o fotografie în picioare — 1000×3000, cum iese din telefon — ar fi fost mărită de
 * 1,92× ca să treacă de lățimea minimă și ar fi ajuns la 11 megapixeli: o pânză de aproape
 * jumătate de gigaoctet în memorie și un fișier peste limita de 5 MB a serverului.
 */
const MAX_PIXELS = 2560 * 1440

/** Logo-ul apare de la 28 px (cardul de mașină) până la 84 px (antetul mini-site-ului). */
const LOGO = { minEdge: 256, maxEdge: 512 }

/**
 * Peste factorul ăsta de mărire imaginea începe să pară spălată, iar o accentuare ușoară a
 * conturului o readuce la un aspect normal. Sub el n-are ce corecta.
 */
const SHARPEN_ABOVE = 1.75

export async function prepareCoverImage(file: File): Promise<PreparedImage> {
  const source = await decode(file)
  const { width, height } = source

  // Mărește cât e nevoie ca ambele laturi să treacă de minim; nu micșorează decât peste plafon.
  let scale = Math.max(COVER.minWidth / width, COVER.minHeight / height, 1)
  if (width * scale > COVER.maxWidth) {
    scale = COVER.maxWidth / width
  }
  if (width * height * scale * scale > MAX_PIXELS) {
    scale = Math.sqrt(MAX_PIXELS / (width * height))
  }

  const output = await render(source, Math.round(width * scale), Math.round(height * scale), scale)
  const prepared = await toFile(output, file.name, 'cover', { preferLossless: false })

  return { file: prepared, note: noteFor(width, height, scale, 'antetul') }
}

export async function prepareLogoImage(file: File): Promise<PreparedImage> {
  // SVG-ul e vectorial: are deja orice dimensiune, iar trecerea lui printr-o pânză l-ar
  // transforma exact în lucrul de care nu are nevoie — pixeli.
  if (file.type === 'image/svg+xml') {
    return { file, note: null }
  }

  const source = await decode(file)
  const { width, height } = source
  const edge = Math.min(width, height)

  let scale = Math.max(LOGO.minEdge / edge, 1)
  if (Math.max(width, height) * scale > LOGO.maxEdge) {
    scale = LOGO.maxEdge / Math.max(width, height)
  }

  const output = await render(source, Math.round(width * scale), Math.round(height * scale), scale)
  // PNG, ca logo-urile cu fundal transparent să rămână transparente.
  const prepared = await toFile(output, file.name, 'logo', { preferLossless: true })

  return { file: prepared, note: noteFor(width, height, scale, 'logo-ul') }
}

function noteFor(
  width: number,
  height: number,
  scale: number,
  subject: 'antetul' | 'logo-ul',
): string | null {
  if (scale <= 1.01) return null

  const from = `${width}×${height}`
  const need = subject === 'antetul' ? 'antetul' : 'logo-ul'

  // Peste 3× spunem și că poate rămâne moale. Sub, mărirea nu se vede și n-are rost speriat omul.
  return scale >= 3
    ? `Imaginea era mică (${from} px) — am mărit-o cât îi trebuie ${need}, dar poate rămâne ușor neclară.`
    : `Am mărit imaginea de la ${from} px, cât îi trebuie ${need}.`
}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  // `from-image` aplică orientarea din EXIF: fără ea, pozele făcute cu telefonul pe lat ajung
  // culcate în antet.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Formate pe care browserul nu le decodează aici (HEIC, de pildă) cad pe calea de mai jos,
      // care dă un mesaj de eroare util în loc să arunce din interiorul unei promisiuni.
    }
  }

  return await new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode'))
    }
    image.src = url
  })
}

/**
 * Redimensionarea propriu-zisă.
 *
 * Mărirea se face în pași de cel mult 2×, nu dintr-o dată. Browserul interpolează pe fiecare pas
 * și rezultatul e vizibil mai curat decât o singură întindere de la 565 la 1920 px — e diferența
 * dintre a mări o fotografie treptat și a o trage brusc de colț.
 */
async function render(
  source: CanvasImageSource & { width: number; height: number },
  targetWidth: number,
  targetHeight: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  let current: CanvasImageSource = source
  let width = source.width
  let height = source.height

  // Pașii merg în ambele sensuri. La micșorare contează la fel de mult: o fotografie de 6000 px
  // adusă dintr-o singură trecere la 2560 capătă zimți pe contururi, pe care pașii îi evită.
  // Niciun pas nu creează o pânză mai mare decât are nevoie, ca o poză de 48 de megapixeli să nu
  // fie copiată o dată la mărimea ei întreagă doar ca să înceapă lucrul.
  for (;;) {
    const next = width < targetWidth
      ? Math.min(targetWidth, width * 2)
      : Math.max(targetWidth, Math.floor(width / 2))

    if (next === width) break

    height = Math.round(height * (next / width))
    width = next
    current = draw(current, width, height)
  }

  const output = draw(current, targetWidth, targetHeight)

  // Peste plafonul de suprafață convoluția ar ține pagina blocată secunde bune; sub el, cea mai
  // mare imagine posibilă e de câteva sute de milisecunde.
  if (scale >= SHARPEN_ABOVE && targetWidth * targetHeight <= MAX_PIXELS) {
    sharpen(output)
  }

  return output
}

function draw(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)

  return canvas
}

/**
 * Accentuare ușoară a conturului („unsharp mask"): scade din imagine o variantă neclară a ei și
 * adaugă diferența înapoi.
 *
 * Neclaritatea e o medie pe 3×3, făcută separabil — întâi pe orizontală, apoi pe verticală — ca
 * să rămână liniară în numărul de pixeli. O gaussiană ar fi arătat marginal mai bine și ar fi
 * costat de câteva ori mai mult pe o imagine de două milioane de pixeli.
 *
 * Cantitatea e mică dinadins: peste ea apar halouri albe pe contururi, iar o fotografie cu
 * halouri arată mai prost decât una moale.
 */
function sharpen(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d')
  if (!context) return

  const { width, height } = canvas
  const image = context.getImageData(0, 0, width, height)
  const pixels = image.data
  const blurred = new Uint8ClampedArray(pixels)

  // Orizontal, apoi vertical. Canalul alfa (offset 3) rămâne neatins: altfel marginile
  // logo-urilor transparente ar căpăta un contur.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const left = (y * width + Math.max(0, x - 1)) * 4
      const right = (y * width + Math.min(width - 1, x + 1)) * 4
      for (let channel = 0; channel < 3; channel++) {
        blurred[index + channel] =
          (pixels[left + channel] + pixels[index + channel] + pixels[right + channel]) / 3
      }
    }
  }

  const twice = new Uint8ClampedArray(blurred)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const up = (Math.max(0, y - 1) * width + x) * 4
      const down = (Math.min(height - 1, y + 1) * width + x) * 4
      for (let channel = 0; channel < 3; channel++) {
        twice[index + channel] =
          (blurred[up + channel] + blurred[index + channel] + blurred[down + channel]) / 3
      }
    }
  }

  const amount = 0.55
  for (let i = 0; i < pixels.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const value = pixels[i + channel]
      pixels[i + channel] = value + amount * (value - twice[i + channel])
    }
  }

  context.putImageData(image, 0, 0)
}

/** Perechea tip MIME + extensie sub care se salvează rezultatul. */
function outputType(preferLossless: boolean): { mime: string; extension: string } {
  if (preferLossless) {
    return { mime: 'image/png', extension: 'png' }
  }
  // WEBP la aceeași calitate vizuală e de câteva ori mai mic decât JPEG, iar serverul îl acceptă.
  return supportsWebp()
    ? { mime: 'image/webp', extension: 'webp' }
    : { mime: 'image/jpeg', extension: 'jpg' }
}

let webpSupport: boolean | null = null

function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  return webpSupport
}

async function toFile(
  canvas: HTMLCanvasElement,
  originalName: string,
  kind: 'cover' | 'logo',
  options: { preferLossless: boolean },
): Promise<File> {
  const { mime, extension } = outputType(options.preferLossless)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, 0.9)
  })

  if (!blob) throw new Error('encode')

  const base = originalName.replace(/\.[^.]+$/, '') || kind
  return new File([blob], `${base}.${extension}`, { type: mime })
}
