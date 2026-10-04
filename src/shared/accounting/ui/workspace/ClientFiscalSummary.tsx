import { Box, Button, Stack, Typography } from '@mui/material'

import { Badge, CalcRows, MeterRow, Metric, MetricGrid, PanelCard } from '../../../../components/panel/ui'
import type { FiscalOverview, PfaAccountingSummary } from '../../api/types'
import { formatDate, formatLei } from '../../format'
import { EmptyText } from '../components'
import { casThreshold, profileBadge, vatRisk } from './fiscal'

/** „Taxe”: totalurile anului, plafoanele și calculul, pe un singur ecran. */
export function ClientFiscalSummary({
  pfa,
  overview,
  year,
  onOpenProfile,
}: {
  pfa: PfaAccountingSummary
  overview: FiscalOverview | null
  year: number
  onOpenProfile: () => void
}) {
  const row = overview?.rows.find((item) => item.pfaId === pfa.id)
  const thresholds = overview?.thresholds ?? null
  const profile = profileBadge(row)
  const hasFigures = row?.grossIncome !== null && row?.grossIncome !== undefined
  const vat = row ? vatRisk(row, thresholds) : null
  const cas = row ? casThreshold(row, thresholds) : null
  const net = row?.netIncome ?? 0
  const facts = [
    pfa.realSystem ? 'Sistem real' : 'Normă de venit',
    pfa.art317 ? `TVA art. 317${pfa.art317ActivationDate ? ` din ${formatDate(pfa.art317ActivationDate)}` : ''}` : 'Fără cod TVA',
    pfa.platforms.map((platform) => (platform === 'BOLT' ? 'Bolt' : 'Uber')).join(', '),
  ].filter(Boolean)

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Badge toneName={profile.tone}>{profile.label}</Badge>
        <Typography sx={{ fontSize: 12, color: 'var(--rl-text-muted)', flex: 1 }}>{facts.join(' · ')}</Typography>
        {row?.stale ? <Badge toneName="yellow">Se recalculează</Badge> : row?.asOf && <Badge>{`la ${formatDate(row.asOf)}`}</Badge>}
        <Button size="small" variant="outlined" onClick={onOpenProfile}>
          Profil fiscal
        </Button>
      </Stack>

      {!hasFigures || !row ? (
        <PanelCard>
          <EmptyText>{row?.profileStatus === 'COMPLETED' ? `Taxele pe ${year} nu sunt calculate încă.` : 'Profil fiscal necompletat.'}</EmptyText>
        </PanelCard>
      ) : (
        <>
          <MetricGrid>
            <Metric label="Venit brut" value={formatLei(row.grossIncome)} />
            <Metric label="Cheltuieli" value={formatLei(row.expenses)} />
            <Metric label="Venit net" value={formatLei(row.netIncome)} />
            <Metric label={`Taxe ${year}`} value={formatLei(row.totalTaxes)} />
          </MetricGrid>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(0, 1fr)' }, gap: 1.5, alignItems: 'start' }}>
            <PanelCard title="Plafoane" sx={{ py: 1 }}>
              {thresholds ? (
                <>
                  <MeterRow
                    label="TVA art. 310"
                    meta={vat?.projection != null ? `Proiecție 31.12: ${formatLei(vat.projection)}` : undefined}
                    value={formatLei(row.grossIncome)}
                    ratio={vat?.ratio ?? 0}
                    toneName={vat?.tone ?? undefined}
                  />
                  <MeterRow
                    label={cas ? `CAS ${cas.label}` : 'CAS 24×'}
                    value={cas ? `${formatLei(net)} / ${formatLei(cas.value)}` : 'atins'}
                    ratio={cas ? net / cas.value : 1}
                    toneName={cas?.near ? 'yellow' : undefined}
                  />
                  <MeterRow label="CASS (max 72×)" value={`${formatLei(Math.min(net, thresholds.cassMax))} / ${formatLei(thresholds.cassMax)}`} ratio={net / thresholds.cassMax} />
                </>
              ) : (
                <EmptyText>—</EmptyText>
              )}
            </PanelCard>
            <PanelCard title="Calcul">
              <CalcRows
                rows={[
                  { label: 'CAS', value: formatLei(row.cas) },
                  { label: 'CASS', value: formatLei(row.cass) },
                  { label: 'Impozit', value: formatLei(row.incomeTax) },
                  { label: 'Total', value: formatLei(row.totalTaxes), total: true },
                ]}
              />
            </PanelCard>
          </Box>
        </>
      )}
    </Stack>
  )
}
