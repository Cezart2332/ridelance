import { Chip } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { CompanyPageReviewStatus } from '../../../../../services/company.service'

/**
 * Verdictul unei pagini, ca etichetă.
 *
 * Într-un singur loc, fiindcă îl citesc și lista, și panoul de verificare. Două tabele de culori
 * pentru aceleași patru stări ar fi ajuns, la prima stare nouă, să nu mai coincidă.
 */
const STATUS_STYLE: Record<CompanyPageReviewStatus, { label: string; color: string }> = {
  Pending: { label: 'De verificat', color: '#f59e0b' },
  Approved: { label: 'Publicată', color: '#10b981' },
  Rejected: { label: 'Refuzată', color: '#ef4444' },
  Draft: { label: 'Ciornă goală', color: '#94a3b8' },
}

export function statusChip(status: CompanyPageReviewStatus) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.Draft

  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.68rem',
        bgcolor: alpha(style.color, 0.1),
        color: style.color,
        border: `1px solid ${alpha(style.color, 0.25)}`,
      }}
    />
  )
}
