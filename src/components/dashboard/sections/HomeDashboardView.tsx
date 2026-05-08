import { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { userService, type DashboardSummary } from '../../../services/user.service'

import iconDocs from '../../../assets/SVG/2- Regular/folder.svg'
import iconPending from '../../../assets/SVG/2- Regular/file.svg'
import iconVerified from '../../../assets/SVG/2- Regular/chart-pie.svg'
import iconNotif from '../../../assets/SVG/2- Regular/headphones.svg'

function pfaStatusChip(status: string | null) {
  if (!status) return null
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
    Approved: { label: 'Aprobat',       color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  }
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  )
}

function docStatusChip(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Verified: { label: 'Verificat',     color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.10) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  }
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) }
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  )
}

const metricCards = (data: DashboardSummary) => [
  {
    label: 'Total documente',
    value: String(data.totalDocuments),
    icon: iconDocs,
  },
  {
    label: 'Verificate',
    value: String(data.approvedDocuments),
    icon: iconVerified,
  },
  {
    label: 'In verificare',
    value: String(data.pendingDocuments),
    icon: iconPending,
  },
  {
    label: 'Notificari necitite',
    value: String(data.unreadNotifications),
    icon: iconNotif,
  },
]

export function HomeDashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  if (!summary) {
    return (
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted }}>
        Nu s-au putut incarca datele. Incearca din nou mai tarziu.
      </Typography>
    )
  }

  return (
    <Stack spacing={2.5}>
      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {metricCards(summary).map((metric) => (
          <Paper
            key={metric.label}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
              background: `linear-gradient(160deg, ${alpha(DASHBOARD_TOKENS.primary, 0.05)} 0%, ${DASHBOARD_TOKENS.paper} 34%)`,
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              '&:hover': { boxShadow: DASHBOARD_TOKENS.shadow.md, borderColor: alpha(DASHBOARD_TOKENS.primary, 0.34) },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }} spacing={1.5}>
              <Box sx={{ p: 1.2, borderRadius: DASHBOARD_TOKENS.radius.md, backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={metric.icon} alt={metric.label} style={{ width: 22, height: 22, filter: 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)' }} />
              </Box>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', fontWeight: 650 }}>
                {metric.label}
              </Typography>
            </Stack>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.8rem' }}>
              {metric.value}
            </Typography>
          </Paper>
        ))}
      </div>

      {/* ── Bottom row: PFA status + Recent documents ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 16 }}>

        {/* PFA Status card */}
        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 12', md: 'span 5' },
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
            Status inregistrare PFA
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Starea cererii tale de inregistrare PFA
          </Typography>

          {summary.pfaStatus ? (
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Status</Typography>
                {pfaStatusChip(summary.pfaStatus)}
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Tip</Typography>
                <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                  {summary.pfaRegistrationType === 'HasPfa' ? 'Am PFA' : 'Nu am PFA'}
                </Typography>
              </Stack>
              {summary.pfaCreatedAtUtc && (
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Data cererii</Typography>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                    {new Date(summary.pfaCreatedAtUtc).toLocaleDateString('ro-RO')}
                  </Typography>
                </Stack>
              )}
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Nu ai o cerere de inregistrare PFA activa.
            </Typography>
          )}
        </Paper>

        {/* Recent documents */}
        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 12', md: 'span 7' },
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
            Documente recente
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Ultimele 5 documente incarcate
          </Typography>

          {summary.recentDocuments.length === 0 ? (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              Nu ai incarcat niciun document inca.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {summary.recentDocuments.map((doc) => (
                <Paper
                  key={doc.id}
                  elevation={0}
                  sx={{
                    p: 1.4,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    backgroundColor: DASHBOARD_TOKENS.surface,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <div style={{ overflow: 'hidden' }}>
                      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.originalFileName}
                      </Typography>
                      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.75rem' }}>
                        {doc.category} · {new Date(doc.uploadedAtUtc).toLocaleDateString('ro-RO')}
                      </Typography>
                    </div>
                    {docStatusChip(doc.status)}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

      </div>
    </Stack>
  )
}
