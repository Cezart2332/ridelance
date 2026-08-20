import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS, responsiveTableContainerSx } from '../../dashboardTheme'
import { Amount, PageHeader, Panel, StatCard, StatusChip } from '../../ui'
import { fiscalOverviewMock } from '../mocks/srl.mock'
import type { FiscalDeclaration } from '../types'
import { useSrlMock } from '../useSrlMock'

/**
 * Fiscal — obligațiile declarative ale societății (spec §3.3.2).
 *
 * TODO: confirm SRL fiscal rules.
 *
 * Pagina **afișează** ce primește și nu derivă nimic: nici impozitul, nici pragurile de micro,
 * nici periodicitatea TVA. Spec-ul marchează §3.3.2 ca asumpție neconfirmată (întrebarea
 * deschisă §9.1) și cere explicit să nu se inventeze formule fiscale. Un calcul greșit aici nu
 * e un bug de UI, e o declarație greșită.
 *
 * Ce dispare față de PFA: Declarația Unică, CASS/CAS pe venit net, plafoanele și contribuțiile
 * personale — toate sunt despre o persoană fizică, nu despre o societate.
 */

/** Cât mai e până la termen, în zile întregi. Singura derivare din pagină, și e calendaristică. */
function daysUntil(iso: string): number {
  const due = new Date(iso)
  const today = new Date()
  const startOfDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((startOfDay(due) - startOfDay(today)) / 86_400_000)
}

function DeadlineChip({ declaration }: { declaration: FiscalDeclaration }) {
  const days = daysUntil(declaration.dueDateUtc)

  if (days < 0) return <StatusChip label="Termen depășit" tone="error" size="sm" outlined />
  if (days === 0) return <StatusChip label="Astăzi" tone="error" size="sm" outlined />
  if (days <= 14) return <StatusChip label={`${days} zile`} tone="warning" size="sm" outlined />
  return <StatusChip label={`${days} zile`} tone="neutral" size="sm" />
}

export function SrlFiscalPage() {
  const { data, loading, error } = useSrlMock(fiscalOverviewMock)

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
        </Box>
        <Skeleton variant="rounded" height={300} />
      </Stack>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error ?? 'Nu am putut încărca situația fiscală.'}
        </Alert>
      </Box>
    )
  }

  const sorted = [...data.declarations].sort((a, b) => a.dueDateUtc.localeCompare(b.dueDateUtc))

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Fiscal"
        subtitle="Regimul fiscal al societății și termenele declarative care urmează."
      />

      <Alert severity="info" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
        Valorile sunt informative și vin de la contabil. RIDElance nu calculează impozite.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Regim fiscal" value={data.regime === 'Micro' ? 'Microîntreprindere' : 'Impozit pe profit'} />
        <StatCard
          label="Plătitor de TVA"
          value={data.vatPayer ? 'Da' : 'Nu'}
          helper={data.vatPayer && data.vatPeriodicity ? `Decont ${data.vatPeriodicity.toLowerCase()}` : undefined}
        />
        <Panel dense>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
            Impozit estimat
          </Typography>
          <Box sx={{ mt: 0.8 }}>
            <Amount value={data.estimatedQuarterlyTaxBani / 100} unit="lei" size="card" decimals={0} />
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
            {data.quarterLabel}
          </Typography>
        </Panel>
      </Box>

      <Panel title="Obligații declarative" subtitle="Termenele legale, în ordinea în care vin.">
        <Box sx={responsiveTableContainerSx}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <Box component="thead">
              <Box component="tr">
                {['Declarație', 'Perioadă', 'Termen', ''].map((heading, index) => (
                  <Box
                    component="th"
                    key={heading || index}
                    sx={{
                      textAlign: 'left',
                      py: 1,
                      px: 1.2,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: DASHBOARD_TOKENS.textMuted,
                      borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
                    }}
                  >
                    {heading}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {sorted.map((declaration) => (
                <Box component="tr" key={`${declaration.code}-${declaration.period}`}>
                  <Box component="td" sx={cellSx}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: DASHBOARD_TOKENS.ink }}>
                      {declaration.code}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textMuted }}>
                      {declaration.label}
                    </Typography>
                  </Box>
                  <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
                    {declaration.period}
                  </Box>
                  <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem', fontWeight: 700 }}>
                    {new Date(declaration.dueDateUtc).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Box>
                  <Box component="td" sx={{ ...cellSx, textAlign: 'right' }}>
                    <DeadlineChip declaration={declaration} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Panel>
    </Stack>
  )
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}
