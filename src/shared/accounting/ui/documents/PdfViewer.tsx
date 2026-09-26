import { useEffect, useRef, useState } from 'react'
import { Alert, Box, CircularProgress, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { normalizeForSearch } from './search'

const RENDER_SCALE = 1.4

/**
 * PDF-ul original, randat cu pdf.js: canvas + text layer (spec F2). `highlight` e fragmentul sursă
 * al câmpului activ; se caută în text layer și se evidențiază rândul care îl conține.
 * `onText` primește textul complet, ca ecranul să poată marca „sursă negăsită”.
 */
export function PdfViewer({
  file,
  highlight,
  onText,
}: {
  file: Blob
  highlight: string | null
  onText?: (text: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<{ file: Blob; status: 'ready' | 'error'; message?: string } | null>(null)
  const onTextRef = useRef(onText)

  useEffect(() => {
    onTextRef.current = onText
  }, [onText])

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    const render = async () => {
      const pdfjs = await import('pdfjs-dist')
      const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      if (cancelled) return
      container.replaceChildren()
      const texts: string[] = []

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        if (cancelled) return
        const viewport = page.getViewport({ scale: RENDER_SCALE })

        const pageBox = window.document.createElement('div')
        pageBox.className = 'pdf-page'
        pageBox.style.width = `${viewport.width}px`
        pageBox.style.height = `${viewport.height}px`
        pageBox.style.setProperty('--scale-factor', String(viewport.scale))
        pageBox.style.setProperty('--total-scale-factor', String(viewport.scale))
        pageBox.style.setProperty('--user-unit', '1')
        pageBox.style.setProperty('--scale-round-x', '1px')
        pageBox.style.setProperty('--scale-round-y', '1px')

        const canvas = window.document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        pageBox.appendChild(canvas)

        const textBox = window.document.createElement('div')
        textBox.className = 'textLayer'
        pageBox.appendChild(textBox)
        container.appendChild(pageBox)

        await page.render({ canvas, viewport }).promise
        const content = await page.getTextContent()
        texts.push(content.items.map((item) => ('str' in item ? item.str : '')).join('\n'))
        await new pdfjs.TextLayer({ textContentSource: content, container: textBox, viewport }).render()
      }
      if (cancelled) return
      setState({ file, status: 'ready' })
      onTextRef.current?.(texts.join('\n'))
    }

    render().catch((error: unknown) => {
      if (!cancelled) setState({ file, status: 'error', message: error instanceof Error ? error.message : undefined })
    })
    return () => {
      cancelled = true
    }
  }, [file])

  // Evidențierea: rândurile din text layer care conțin fragmentul.
  useEffect(() => {
    const container = containerRef.current
    if (!container || state?.status !== 'ready') return
    const spans = [...container.querySelectorAll<HTMLSpanElement>('.textLayer span')]
    spans.forEach((span) => span.classList.remove('source-highlight'))
    if (!highlight) return
    const needle = normalizeForSearch(highlight)
    const matches = spans.filter((span) => normalizeForSearch(span.textContent ?? '').includes(needle))
    matches.forEach((span) => span.classList.add('source-highlight'))
    matches[0]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlight, state])

  const ready = state?.file === file && state.status === 'ready'
  const failed = state?.file === file && state.status === 'error'

  return (
    <Stack sx={{ position: 'relative', height: '100%', minHeight: 0 }}>
      {failed && <Alert severity="error">PDF-ul nu a putut fi afișat{state?.message ? `: ${state.message}` : '.'}</Alert>}
      {!ready && !failed && (
        <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      <Box
        ref={containerRef}
        sx={(theme) => ({
          overflow: 'auto',
          flex: 1,
          bgcolor: 'grey.100',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          '& .pdf-page': { position: 'relative', flexShrink: 0, bgcolor: 'background.paper', boxShadow: theme.shadows[8] },
          '& .pdf-page canvas': { display: 'block', width: '100%', height: '100%' },
          // Stilurile minime ale text layer-ului pdf.js (din `pdf_viewer.css`).
          '& .textLayer': {
            position: 'absolute',
            inset: 0,
            overflow: 'clip',
            lineHeight: 1,
            textAlign: 'initial',
            transformOrigin: '0 0',
            '--min-font-size': 1,
            '--text-scale-factor': 'calc(var(--total-scale-factor) * var(--min-font-size))',
            '--min-font-size-inv': 'calc(1 / var(--min-font-size))',
          },
          '& .textLayer :is(span, br)': {
            color: 'transparent',
            position: 'absolute',
            whiteSpace: 'pre',
            cursor: 'text',
            transformOrigin: '0% 0%',
          },
          '& .textLayer > span': {
            '--font-height': 0,
            fontSize: 'calc(var(--text-scale-factor) * var(--font-height))',
            '--scale-x': 1,
            '--rotate': '0deg',
            transform: 'rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv))',
          },
          '& .textLayer .source-highlight': {
            bgcolor: alpha(theme.palette.warning.main, 0.35),
            borderRadius: 0.5,
          },
        })}
      />
    </Stack>
  )
}
