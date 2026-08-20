import type { ReactNode } from 'react'
import { Chip } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { documentStatusText, documentStatusTone, type StatusTone } from './statusTone'

const TONE_STYLES: Record<StatusTone, { color: string; bg: string; border: string }> = {
  active: {
    color: DASHBOARD_TOKENS.stateActive,
    bg: alpha(DASHBOARD_TOKENS.stateActive, 0.1),
    border: alpha(DASHBOARD_TOKENS.stateActive, 0.22),
  },
  neutral: {
    color: DASHBOARD_TOKENS.stateNeutral,
    bg: alpha(DASHBOARD_TOKENS.ink, 0.06),
    border: alpha(DASHBOARD_TOKENS.ink, 0.12),
  },
  warning: {
    color: DASHBOARD_TOKENS.stateWarning,
    bg: alpha(DASHBOARD_TOKENS.stateWarning, 0.1),
    border: alpha(DASHBOARD_TOKENS.stateWarning, 0.24),
  },
  error: {
    color: DASHBOARD_TOKENS.stateError,
    bg: alpha(DASHBOARD_TOKENS.stateError, 0.1),
    border: alpha(DASHBOARD_TOKENS.stateError, 0.22),
  },
}

export interface StatusChipProps {
  label: string
  tone?: StatusTone
  size?: 'sm' | 'md'
  icon?: ReactNode
  outlined?: boolean
}

/** Singurul chip de stare din dashboard. */
export function StatusChip({ label, tone = 'neutral', size = 'md', icon, outlined }: StatusChipProps) {
  const style = TONE_STYLES[tone]
  const small = size === 'sm'

  return (
    <Chip
      label={label}
      size="small"
      icon={icon as never}
      sx={{
        height: small ? 20 : 26,
        fontSize: small ? '0.68rem' : '0.75rem',
        fontWeight: 800,
        borderRadius: DASHBOARD_TOKENS.radius.full,
        color: style.color,
        backgroundColor: style.bg,
        border: outlined ? `1px solid ${style.border}` : 'none',
        '& .MuiChip-icon': { color: style.color, fontSize: small ? 14 : 16 },
      }}
    />
  )
}

/** Chip pentru statusul unui document / al unei cheltuieli. */
export function DocumentStatusChip({ status, size }: { status: string | null | undefined; size?: 'sm' | 'md' }) {
  return <StatusChip label={documentStatusText(status)} tone={documentStatusTone(status)} size={size} />
}

/** Chip pentru statusul înregistrării PFA. */
export function PfaStatusChip({ status }: { status: string | null | undefined }) {
  if (!status) return null
  const map: Record<string, { label: string; tone: StatusTone }> = {
    Pending: { label: 'PFA în verificare', tone: 'neutral' },
    Approved: { label: 'PFA activ', tone: 'active' },
    Rejected: { label: 'PFA respins', tone: 'error' },
  }
  const cfg = map[status] ?? { label: status, tone: 'neutral' as StatusTone }
  return <StatusChip label={cfg.label} tone={cfg.tone} />
}

export default StatusChip
