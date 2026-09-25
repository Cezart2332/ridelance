import type { ReactNode } from 'react'
import { Box } from '@mui/material'

export interface StatGridProps {
  children: ReactNode
  /** Coloane pe ecranele mari. */
  columns?: number
  /** Coloane pe telefon. Implicit două: câte una pe rând, cifrele umpleau primul ecran. */
  mobileColumns?: number
}

/**
 * Grila cartonașelor cu cifre (`StatCard`). Pe telefon stau două pe rând și compacte, ca pagina să
 * ajungă repede la ce se poate face pe ea — lista de mașini, de închirieri —, nu la patru carduri
 * cu câte o cifră, unul sub altul.
 */
export function StatGrid({ children, columns = 4, mobileColumns = 2 }: StatGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${mobileColumns}, minmax(0, 1fr))`,
          md: `repeat(${Math.min(columns, 3)}, minmax(0, 1fr))`,
          lg: `repeat(${columns}, minmax(0, 1fr))`,
        },
        gap: { xs: 1, md: 2 },
      }}
    >
      {children}
    </Box>
  )
}

export default StatGrid
