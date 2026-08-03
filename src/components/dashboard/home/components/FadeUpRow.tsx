import type { ReactNode } from 'react'
import { Box } from '@mui/material'

/**
 * Intrarea în pagină, rând cu rând (spec §7). Nimic nu întârzie citirea unei cifre:
 * 280ms, decalaj de 40ms pe rând, oprit complet la `prefers-reduced-motion`.
 */
export function FadeUpRow({ index, children }: { index: number; children: ReactNode }) {
  return (
    <Box
      sx={{
        '@keyframes homeFadeUp': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
        animation: `homeFadeUp 280ms ease-out ${Math.min(index, 4) * 40}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {children}
    </Box>
  )
}
