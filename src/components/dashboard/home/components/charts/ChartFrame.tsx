import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

/**
 * Containerul unui grafic, care își randează conținutul abia după ce are o lățime reală.
 *
 * `ResponsiveContainer` se măsoară la montare. Când părintele nu e încă așezat — primul cadru,
 * un panou care tocmai s-a deschis, o coloană flex care nu s-a distribuit — măsoară -1 și scrie
 * în consolă un avertisment pentru fiecare grafic, la fiecare randare. Graficul apare corect
 * imediat după, deci avertismentul e zgomot, dar zgomotul ăsta acoperă erorile reale.
 *
 * Un cadru care așteaptă măsurătoarea rezolvă cauza, nu simptomul.
 */
interface ChartFrameProps {
  height: number
  children: ReactNode
  /** Atribute de accesibilitate: graficul e o imagine cu descriere. */
  ariaLabel: string
  sx?: SxProps<Theme>
}

export function ChartFrame({ height, children, ariaLabel, sx }: ChartFrameProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [measured, setMeasured] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      // O singură comutare: odată ce a avut lățime, rămâne randat. Altfel un panou care se
      // închide ar demonta graficul și l-ar reconstrui la redeschidere.
      if (width > 0) {
        setMeasured(true)
        observer.disconnect()
      }
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Box
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      sx={{ position: 'relative', height, width: '100%', ...sx }}
    >
      {measured ? children : null}
    </Box>
  )
}
