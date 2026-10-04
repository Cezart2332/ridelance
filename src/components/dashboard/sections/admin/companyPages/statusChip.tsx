import { Chip } from '@mui/material'

import type { CompanyPageReviewStatus } from '../../../../../services/company.service'
import { fade } from '../../../../panel/tokens'

/**
 * Verdictul unei pagini, ca etichetă.
 *
 * Într-un singur loc, fiindcă îl citesc și lista, și panoul de verificare. Două tabele de culori
 * pentru aceleași patru stări ar fi ajuns, la prima stare nouă, să nu mai coincidă.
 */
const STATUS_STYLE: Record<CompanyPageReviewStatus, { label: string; color: string }> = {
  Pending: { label: 'De verificat', color: 'var(--rl-yellow-text)' },
  Approved: { label: 'Publicată', color: 'var(--rl-green-text)' },
  Rejected: { label: 'Refuzată', color: 'var(--rl-red-text)' },
  Draft: { label: 'Ciornă goală', color: 'var(--rl-text-muted)' },
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
        bgcolor: fade(style.color, 0.1),
        color: style.color,
        border: `1px solid ${fade(style.color, 0.25)}`,
      }}
    />
  )
}
