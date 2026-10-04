import { Box, Link, Stack } from '@mui/material'

import { Badge, CalcRows, Callout, FactItem, MeterRow, Metric, MetricGrid, PanelCard } from '../../../../components/panel/ui'
import type { FiscalOverview, PfaAccountingSummary } from '../../api/types'
import { formatDate, formatLei } from '../../format'
import { EmptyText } from '../components'
import { casThreshold, profileBadge, vatRisk } from './fiscal'

/** Sursele oficiale ale regulilor aplicate în calcul. */
const SOURCES = [
  { label: 'ANAF · D212 / activități independente 2026', href: 'https://static.anaf.ro/static/10/Cluj/cj_DU_activ_indep_22apr2026.pdf' },
  { label: 'Legea 239/2025 · modificări Cod fiscal', href: 'https://legislatie.just.ro/Public/DetaliiDocumentAfis/305296' },
  { label: 'Cod fiscal · art. 150 (excepții CAS)', href: 'https://legislatie.just.ro/Public/FormaPrintabila/00000G14OLHYELXJDOI18FLUIRKWSSRA' },
  { label: 'ANAF · plafon TVA 395.000 lei', href: 'https://static.anaf.ro/static/3/Cluj/20250912120026_cj_%20plafon_tva_12sep2025.pdf' },
]

/**
 * „Rezumat fiscal”: veniturile și taxele anului din ultima rulare a motorului, plafoanele (TVA
 * art. 310, pragurile CAS, minimul și plafonul CASS) și starea fiscală a clientului.
 */
export function ClientFiscalSummary({ pfa, overview, year }: { pfa: PfaAccountingSummary; overview: FiscalOverview | null; year: number }) {
  const row = overview?.rows.find((item) => item.pfaId === pfa.id)
  const thresholds = overview?.thresholds ?? null
  const profile = profileBadge(row)
  const hasFigures = row?.grossIncome !== null && row?.grossIncome !== undefined

  const vat = row ? vatRisk(row, thresholds) : null
  const cas = row ? casThreshold(row, thresholds) : null
  const net = row?.netIncome ?? 0

  if (!overview) return <PanelCard title={`Rezumat fiscal ${year}`}><EmptyText>Datele fiscale nu sunt disponibile momentan.</EmptyText></PanelCard>

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(320px, 0.8fr)' }, gap: 1.75, alignItems: 'start' }}>
      <Stack spacing={1.75} sx={{ minWidth: 0 }}>
        <PanelCard
          title={`Rezumat fiscal ${year}`}
          actions={row?.stale ? <Badge toneName="yellow">Se recalculează</Badge> : row?.asOf ? <Badge>{`la ${formatDate(row.asOf)}`}</Badge> : undefined}
        >
          {hasFigures ? (
            <MetricGrid>
              <Metric label="Venit brut" value={formatLei(row?.grossIncome)} />
              <Metric label="Cheltuieli deductibile" value={formatLei(row?.expenses)} />
              <Metric label="Venit net" value={formatLei(row?.netIncome)} />
              <Metric label="Taxe estimate" value={formatLei(row?.totalTaxes)} />
            </MetricGrid>
          ) : (
            <EmptyText>{row?.profileStatus === 'COMPLETED' ? 'Taxele nu au fost încă calculate pentru acest an.' : 'Profilul fiscal nu e completat: taxele se calculează după confirmarea lui.'}</EmptyText>
          )}
        </PanelCard>

        <PanelCard title="Plafoane și risc">
          {thresholds && hasFigures && row ? (
            <>
              <MeterRow
                label="TVA art. 310"
                meta={`${formatLei(Math.max(0, thresholds.vatArt310 - (row.grossIncome ?? 0)))} până la plafon`}
                value={formatLei(row.grossIncome)}
                ratio={vat?.ratio ?? 0}
                toneName={vat?.tone ?? undefined}
              />
              {vat?.projection !== null && vat?.projection !== undefined && (
                <Callout toneName={vat.projection >= thresholds.vatArt310 ? 'yellow' : undefined}>
                  Proiecție 31.12: {formatLei(vat.projection)}
                  {vat.projection >= thresholds.vatArt310 ? ' · risc de depășire' : ''}
                </Callout>
              )}
              {cas ? (
                <MeterRow label={`CAS · prag ${cas.label}`} meta={`Prag ${formatLei(cas.value)}`} value={formatLei(Math.min(net, cas.value))} ratio={net / cas.value} toneName={cas.near ? 'yellow' : undefined} />
              ) : (
                <MeterRow label="CAS · prag 24×" meta="Pragul maxim atins" value={formatLei(thresholds.cas24)} ratio={1} />
              )}
              <MeterRow label="CASS · minim 6×" meta={`Prag ${formatLei(thresholds.cassMin)}`} value={formatLei(Math.min(net, thresholds.cassMin))} ratio={net / thresholds.cassMin} />
              <MeterRow label="CASS · plafon 72×" meta={`Plafon ${formatLei(thresholds.cassMax)}`} value={formatLei(Math.min(net, thresholds.cassMax))} ratio={net / thresholds.cassMax} />
            </>
          ) : (
            <EmptyText>Barele apar după primul calcul al taxelor.</EmptyText>
          )}
        </PanelCard>
      </Stack>

      <Stack spacing={1.75} sx={{ minWidth: 0 }}>
        <PanelCard title="Calcul taxe">
          {hasFigures && row ? (
            <CalcRows
              rows={[
                { label: 'Venit net', value: formatLei(row.netIncome) },
                { label: 'CAS', value: formatLei(row.cas) },
                { label: 'CASS', value: formatLei(row.cass) },
                { label: 'Impozit pe venit', value: formatLei(row.incomeTax) },
                { label: 'Total taxe estimate', value: formatLei(row.totalTaxes), total: true },
              ]}
            />
          ) : (
            <EmptyText>—</EmptyText>
          )}
        </PanelCard>

        <PanelCard title="Stare fiscală">
          <Stack spacing={0.875}>
            <FactItem label="Profil fiscal" value={<Badge toneName={profile.tone}>{profile.label}</Badge>} />
            <FactItem label="Regim" value={pfa.realSystem ? 'Sistem real' : 'Normă de venit'} />
            <FactItem label="TVA normal (art. 316)" value={pfa.vatPayer ? 'Da' : 'Nu'} />
            <FactItem label="TVA special (art. 317)" value={pfa.art317 ? `Activ${pfa.art317ActivationDate ? ` din ${formatDate(pfa.art317ActivationDate)}` : ''}` : 'Nu'} />
            <FactItem label="Platforme" value={pfa.platforms.length ? pfa.platforms.map((platform) => (platform === 'BOLT' ? 'Bolt' : 'Uber')).join(', ') : '—'} />
          </Stack>
        </PanelCard>

        <PanelCard title="Surse oficiale">
          <Stack spacing={0.75}>
            {SOURCES.map((source) => (
              <Link
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                underline="hover"
                sx={{ px: 1.25, py: 1, borderRadius: '8px', border: '1px solid var(--rl-border)', bgcolor: 'var(--rl-card-alt)', color: 'var(--rl-fg)', fontSize: 12, fontWeight: 500 }}
              >
                {source.label}
              </Link>
            ))}
          </Stack>
        </PanelCard>
      </Stack>
    </Box>
  )
}
