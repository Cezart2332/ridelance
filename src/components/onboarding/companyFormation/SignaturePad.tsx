import { Box, Button, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

import { TOKENS } from '../onboardingTheme'

export interface SignaturePoint {
  x: number
  y: number
  /** Milisecunde de la începutul trasării — parte din probatoriu. */
  t: number
  p: number
}

export interface SignatureStroke {
  points: SignaturePoint[]
  color: string
  width: number
}

export interface SignatureResult {
  /** PNG cu fundal transparent, decupat la traseu plus 8px de margine. */
  image: string
  strokes: SignatureStroke[]
  canvasWidth: number
  canvasHeight: number
}

const COLORS = [
  { value: '#1E3A8A', label: 'Albastru' },
  { value: '#111111', label: 'Negru' },
]

const STROKE_WIDTH = 2.4
/** Marginea din jurul semnăturii decupate, în px de canvas. */
const EXPORT_PADDING = 8
/** Exportăm mărit, ca semnătura să nu iasă pixelată în actele PDF. */
const EXPORT_SCALE = 3

/** Un punct sau o linie scurtă nu e semnătură — cerem un traseu cu substanță. */
function isRealSignature(strokes: SignatureStroke[]): boolean {
  if (strokes.length === 0) return false
  if (strokes.length >= 2) return true

  const points = strokes[0].points
  let length = 0
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }

  const box = boundingBox(strokes)
  return length > 150 && box.width > 40 && box.height > 20
}

function boundingBox(strokes: SignatureStroke[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  }

  return { minX, minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Desenează traseele cu interpolare quadratic prin mijloacele segmentelor: linia dreaptă între
 * punctele brute face semnătura să arate colțuroasă la viteză mare.
 */
function paint(ctx: CanvasRenderingContext2D, strokes: SignatureStroke[], offsetX = 0, offsetY = 0) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const stroke of strokes) {
    const points = stroke.points
    if (points.length === 0) continue

    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.beginPath()

    if (points.length === 1) {
      // Un punct singur: îl desenăm ca bulină, altfel nu se vede nimic.
      ctx.arc(points[0].x - offsetX, points[0].y - offsetY, stroke.width / 2, 0, Math.PI * 2)
      ctx.fillStyle = stroke.color
      ctx.fill()
      continue
    }

    ctx.moveTo(points[0].x - offsetX, points[0].y - offsetY)
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2 - offsetX
      const midY = (points[i].y + points[i + 1].y) / 2 - offsetY
      ctx.quadraticCurveTo(points[i].x - offsetX, points[i].y - offsetY, midX, midY)
    }
    const last = points[points.length - 1]
    ctx.lineTo(last.x - offsetX, last.y - offsetY)
    ctx.stroke()
  }
}

interface SignaturePadProps {
  /** `null` cât timp traseul nu e o semnătură validă. */
  onChange: (result: SignatureResult | null) => void
  disabled?: boolean
}

/**
 * Pad-ul de semnătură. Implementare proprie pe canvas 2D — o dependință nouă ar aduce mai mult
 * decât ne trebuie și mai puțin control asupra a ce se exportă.
 */
export function SignaturePad({ onChange, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokesRef = useRef<SignatureStroke[]>([])
  const drawingRef = useRef(false)
  const startedAtRef = useRef(0)

  const [color, setColor] = useState(COLORS[0].value)
  const [hasInk, setHasInk] = useState(false)

  /** Redesenează traseele. Se apelează la fiecare mișcare, deci nu redimensionează canvasul. */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    paint(ctx, strokesRef.current)
  }, [])

  /** Aliniază buffer-ul canvasului la dimensiunea reală și la densitatea ecranului. */
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.round(rect.width * dpr)
    const height = Math.round(rect.height * dpr)

    // Scrierea în width/height golește canvasul, deci o facem doar când chiar s-a schimbat.
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    redraw()
  }, [redraw])

  useEffect(() => {
    resize()

    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => resize())
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resize])

  /** Compune rezultatul: PNG transparent decupat la traseu, plus vectorul brut. */
  const emit = useCallback(() => {
    const canvas = canvasRef.current
    const strokes = strokesRef.current

    if (!canvas || !isRealSignature(strokes)) {
      onChange(null)
      return
    }

    const rect = canvas.getBoundingClientRect()
    const box = boundingBox(strokes)

    const exported = document.createElement('canvas')
    exported.width = Math.ceil((box.width + EXPORT_PADDING * 2) * EXPORT_SCALE)
    exported.height = Math.ceil((box.height + EXPORT_PADDING * 2) * EXPORT_SCALE)

    const ctx = exported.getContext('2d')
    if (!ctx) {
      onChange(null)
      return
    }

    ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0)
    paint(ctx, strokes, box.minX - EXPORT_PADDING, box.minY - EXPORT_PADDING)

    onChange({
      image: exported.toDataURL('image/png'),
      strokes,
      canvasWidth: Math.round(rect.width),
      canvasHeight: Math.round(rect.height),
    })
  }, [onChange])

  const pointAt = (event: React.PointerEvent<HTMLCanvasElement>): SignaturePoint => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      t: Math.round(performance.now() - startedAtRef.current),
      p: event.pressure > 0 ? Number(event.pressure.toFixed(2)) : 0.5,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true

    if (strokesRef.current.length === 0) {
      startedAtRef.current = performance.now()
    }

    strokesRef.current = [
      ...strokesRef.current,
      { points: [pointAt(event)], color, width: STROKE_WIDTH },
    ]
    setHasInk(true)
    redraw()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return

    const current = strokesRef.current[strokesRef.current.length - 1]
    current.points.push(pointAt(event))
    redraw()
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
    emit()
  }

  const clear = () => {
    strokesRef.current = []
    drawingRef.current = false
    setHasInk(false)
    redraw()
    onChange(null)
  }

  return (
    <Stack spacing={1.5}>
      <Box sx={{ position: 'relative' }}>
        <Box
          component="canvas"
          ref={canvasRef}
          role="img"
          aria-label="Zonă de semnătură"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          sx={{
            display: 'block',
            width: '100%',
            height: { xs: 180, sm: 200 },
            borderRadius: `${TOKENS.radius.md}px`,
            border: `1px solid ${TOKENS.border}`,
            backgroundColor: '#fff',
            // Fără asta, degetul derulează pagina în loc să deseneze.
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'crosshair',
          }}
        />

        {/* Linia de bază și îndemnul dispar la prima atingere, ca să nu stea peste semnătură. */}
        {!hasInk && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: 48,
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <Box sx={{ borderBottom: `1px dashed ${TOKENS.border}`, mb: 1 }} />
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem' }}>
              Semnează deasupra liniei
            </Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {COLORS.map((option) => (
          <Box
            key={option.value}
            component="button"
            type="button"
            aria-label={option.label}
            aria-pressed={color === option.value}
            onClick={() => setColor(option.value)}
            disabled={disabled}
            sx={{
              width: 24,
              height: 24,
              p: 0,
              borderRadius: '50%',
              cursor: 'pointer',
              backgroundColor: option.value,
              border: color === option.value ? `2px solid ${TOKENS.ink}` : `1px solid ${TOKENS.border}`,
              outlineOffset: 2,
            }}
          />
        ))}

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={clear}
          disabled={disabled || !hasInk}
          sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.textMuted }}
        >
          Șterge
        </Button>
      </Stack>
    </Stack>
  )
}
