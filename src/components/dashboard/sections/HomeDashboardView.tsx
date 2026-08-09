import { useMemo } from 'react'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'

import { HOME_TOKENS, SPLIT_ROW } from '../home/tokens'
import { formatPeriodLabel } from '../home/format'
import { useDashboardFilters } from '../home/useDashboardFilters'
import { useDashboardSummary } from '../home/useDashboardData'
import { CONDENSED_HEADER_HEIGHT } from '../home/useCondensedHeader'
import { DashboardHeader } from '../home/components/DashboardHeader'
import { FadeUpRow } from '../home/components/FadeUpRow'
import { KpiTile } from '../home/components/KpiTile'
import { HomeCard } from '../home/components/HomeCard'
import { TaxReserveCard } from '../home/components/TaxReserveCard'
import { RealProfitCard } from '../home/components/RealProfitCard'
import { PlatformBreakdown } from '../home/components/PlatformBreakdown'
import { NetEarningsChart } from '../home/components/charts/NetEarningsChart'
import { FeesAndTaxesChart } from '../home/components/charts/FeesAndTaxesChart'
import { RealProfitTrendChart } from '../home/components/charts/RealProfitTrendChart'
import { RidesHistoryTable } from '../home/components/RidesHistoryTable'
import { isSeverelyStale } from '../home/sourceFreshness'
import { CardError, CardSkeleton, TileSkeleton } from '../home/components/states/CardStates'
import type { PfaDashboardSummary, RidesPage } from '../../../services/pfaDashboard.service'

interface HomeDashboardViewProps {
  onNavigate?: (sectionId: string) => void
}

const COMPARISON_LABELS: Record<string, string> = {
  week: 'vs săptămâna anterioară',
  month: 'vs luna anterioară',
  prevMonth: 'vs luna precedentă ei',
  year: 'vs anul anterior',
  custom: 'vs perioada anterioară echivalentă',
}

/** `gap: 16px` uniform, pe ambele axe — spec §6.3. */
const GRID_GAP = 2

/**
 * „Acasă" — pagina construită pe realitatea financiară a șoferului, nu pe sursele de date:
 * cât am făcut → ce e al meu / ce nu e al meu → cum a evoluat → de unde a venit → ce am făcut concret.
 * Modulele de import (CSV Uber, API Bolt) trăiesc în secțiunea Platforme; aici rămâne doar
 * pastila de stare din antet.
 */
export function HomeDashboardView({ onNavigate }: HomeDashboardViewProps) {
  const { filters, setPeriod, setCustomRange, setPlatform, setPayment, reset } = useDashboardFilters()

  const query = useMemo(
    () => ({
      from: filters.from,
      to: filters.to,
      platform: filters.platform,
      payment: filters.payment,
    }),
    [filters.from, filters.to, filters.platform, filters.payment],
  )

  const { data, isLoading, isFetching, error, reload } = useDashboardSummary(query)

  return (
    <HomeDashboardContent
      data={data}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={reload}
      filters={filters}
      onPeriodChange={setPeriod}
      onCustomRangeChange={setCustomRange}
      onPlatformChange={setPlatform}
      onPaymentChange={setPayment}
      onReset={reset}
      onNavigate={onNavigate}
    />
  )
}

export interface HomeDashboardContentProps {
  data: PfaDashboardSummary | null
  isLoading: boolean
  isFetching: boolean
  error: string | null
  onRetry: () => void
  filters: ReturnType<typeof useDashboardFilters>['filters']
  onPeriodChange: ReturnType<typeof useDashboardFilters>['setPeriod']
  onCustomRangeChange: ReturnType<typeof useDashboardFilters>['setCustomRange']
  onPlatformChange: ReturnType<typeof useDashboardFilters>['setPlatform']
  onPaymentChange: ReturnType<typeof useDashboardFilters>['setPayment']
  onReset: () => void
  onNavigate?: (sectionId: string) => void
  /** Demo-ul public injectează curse mock în locul apelului autentificat. */
  ridesOverride?: RidesPage
}

/**
 * Ecranul propriu-zis, separat de încărcarea datelor ca să poată fi randat identic
 * și în demo-ul public, cu date mock.
 */
export function HomeDashboardContent({
  data,
  isLoading,
  isFetching,
  error,
  onRetry,
  filters,
  onPeriodChange,
  onCustomRangeChange,
  onPlatformChange,
  onPaymentChange,
  onReset,
  onNavigate,
  ridesOverride,
}: HomeDashboardContentProps) {
  const periodLabel = formatPeriodLabel(filters.from, filters.to)
  const comparisonLabel = COMPARISON_LABELS[filters.period] ?? COMPARISON_LABELS.custom
  const goToSources = () => onNavigate?.('profile')

  const sources = data?.sources
  const noSources = !!sources && !sources.bolt.configured && !sources.uber.connected
  // Vechimea obișnuită e semnalată de punctul ambru din pastila de surse. Aici escaladăm
  // doar cazul în care cifrele de pe ecran descriu, practic, altă perioadă.
  const showStaleAlert = !!sources && isSeverelyStale(sources)
  const onlyOneSource =
    !!sources && sources.bolt.configured !== sources.uber.connected && !noSources

  return (
    <Stack spacing={0} sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
      <DashboardHeader
        filters={filters}
        sources={sources ?? null}
        onOpenSources={goToSources}
        onPeriodChange={onPeriodChange}
        onCustomRangeChange={onCustomRangeChange}
        onPlatformChange={onPlatformChange}
        onPaymentChange={onPaymentChange}
        onReset={onReset}
      />

      <Stack
        spacing={GRID_GAP}
        sx={{ pt: GRID_GAP, scrollMarginTop: `${CONDENSED_HEADER_HEIGHT}px` }}
      >
        {onlyOneSource && (
          <Chip
            label={
              sources?.bolt.configured
                ? 'Uber neconectat — datele afișate includ doar Bolt'
                : 'Bolt neconectat — datele afișate includ doar Uber'
            }
            onClick={goToSources}
            sx={{
              alignSelf: 'flex-start',
              bgcolor: HOME_TOKENS.bg.surface,
              border: `1px solid ${HOME_TOKENS.border.subtle}`,
              color: HOME_TOKENS.text.secondary,
              fontSize: 12,
            }}
          />
        )}

        {error && !data ? (
          <HomeCard title="Nu am putut încărca dashboardul">
            <CardError message={error} onRetry={onRetry} />
          </HomeCard>
        ) : noSources ? (
          <EmptyAccountCard onConnectBolt={goToSources} onImportUber={goToSources} />
        ) : (
          <Box sx={{ opacity: isFetching && data ? 0.6 : 1, transition: 'opacity 150ms ease-out' }}>
            <Stack spacing={GRID_GAP}>
              {/*
                ── Rândul de sus: blocul de cifre lângă graficul mare ──
                Șase carduri egale pe un rând arată ca un raport generat automat. Referința
                pune un bloc dens de KPI-uri lângă o singură suprafață mare, iar asta e ce
                dă senzația de ierarhie.
              */}
              <FadeUpRow index={0}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: GRID_GAP,
                    gridTemplateColumns: '1fr',
                    [SPLIT_ROW]: { gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gap: GRID_GAP,
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(3, minmax(0, 1fr))',
                      },
                      [SPLIT_ROW]: { gridColumn: 'span 7' },
                    }}
                  >
                    {isLoading || !data
                      ? Array.from({ length: 6 }).map((_, index) => <TileSkeleton key={index} />)
                      : [
                          <KpiTile
                            key="net"
                            label="Încasări nete"
                            metric={data.kpis.netEarnings}
                            unit="lei"
                            subtext="după comisioane platforme"
                            comparisonLabel={comparisonLabel}
                          />,
                          <KpiTile
                            key="fees"
                            label="Comision platforme"
                            metric={data.kpis.platformFees}
                            unit="lei"
                            subtext="reținut de Bolt și Uber"
                            invertDelta
                            comparisonLabel={comparisonLabel}
                          />,
                          <KpiTile
                            key="hours"
                            label="Ore online"
                            metric={data.kpis.onlineHours}
                            unit="h"
                            decimals={1}
                            subtext="timp activ raportat de platforme"
                            comparisonLabel={comparisonLabel}
                          />,
                          <KpiTile
                            key="km"
                            label="Km în cursă"
                            metric={data.kpis.rideKm}
                            unit="km"
                            decimals={1}
                            subtext="doar km cu pasager"
                            comparisonLabel={comparisonLabel}
                          />,
                          <KpiTile
                            key="perHour"
                            label="Net / oră"
                            metric={data.kpis.netPerHour}
                            unit="lei/h"
                            subtext="încasări nete ÷ ore online"
                            comparisonLabel={comparisonLabel}
                          />,
                          <KpiTile
                            key="perKm"
                            label="Net / km"
                            metric={data.kpis.netPerKm}
                            unit="lei/km"
                            subtext="încasări nete ÷ km în cursă"
                            comparisonLabel={comparisonLabel}
                          />,
                        ]}
                  </Box>

                  <Box sx={{ minWidth: 0, [SPLIT_ROW]: { gridColumn: 'span 5' } }}>
                    {isLoading || !data ? (
                      <CardSkeleton height={340} />
                    ) : (
                      <NetEarningsChart
                        points={data.series.netEarnings}
                        total={data.kpis.netEarnings.value}
                        granularity={data.period.granularity}
                        animate={!isFetching}
                      />
                    )}
                  </Box>
                </Box>
              </FadeUpRow>

              {/* Alerta de date vechi stă peste blocul de cifre, nu peste toată grila:
                  full-width, împingea KPI-urile sub fold pentru un avertisment de rutină. */}
              {showStaleAlert && (
                <Alert
                  severity="warning"
                  variant="standard"
                  icon={false}
                  sx={{
                    maxWidth: { lg: '58%' },
                    py: 0.5,
                    borderRadius: HOME_TOKENS.radius.card,
                    border: `1px solid ${HOME_TOKENS.warn[200]}`,
                    bgcolor: HOME_TOKENS.warn[50],
                    color: HOME_TOKENS.text.primary,
                    fontSize: 13,
                  }}
                  action={
                    <Button
                      size="small"
                      onClick={goToSources}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13 }}
                    >
                      Deschide sursele
                    </Button>
                  }
                >
                  O sursă nu a mai fost actualizată de peste o săptămână — cifrele de mai sus
                  pot descrie o perioadă mai scurtă decât cea selectată.
                </Alert>
              )}

              {/* ── Ce e al meu, ce nu e al meu ── */}
              <FadeUpRow index={1}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: GRID_GAP,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, minmax(0, 1fr))' },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <Box sx={{ gridColumn: { lg: 'span 7' } }}>
                        <CardSkeleton height={380} />
                      </Box>
                      <Box sx={{ gridColumn: { lg: 'span 5' } }}>
                        <CardSkeleton height={380} />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ gridColumn: { lg: 'span 7' }, minWidth: 0 }}>
                        <TaxReserveCard
                          reserve={data.taxReserve}
                          periodLabel={periodLabel}
                          onOpenExpenses={onNavigate ? () => onNavigate('expenses') : undefined}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { lg: 'span 5' }, minWidth: 0 }}>
                        <RealProfitCard profit={data.realProfit} />
                      </Box>
                    </>
                  )}
                </Box>
              </FadeUpRow>

              {/* ── De unde a venit, unde se duce, cum a evoluat ── */}
              <FadeUpRow index={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: GRID_GAP,
                    // `lg` (1200), nu `xl` (1536): la 1440 cele trei carduri încap pe un rând,
                    // iar cu `xl` al treilea trecea singur pe rândul următor, lăsând un gol.
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                      lg: 'repeat(3, minmax(0, 1fr))',
                    },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <CardSkeleton height={300} />
                      <CardSkeleton height={300} />
                      <CardSkeleton height={300} />
                    </>
                  ) : (
                    <>
                      <PlatformBreakdown rows={data.platformSplit} animate={!isFetching} />
                      <FeesAndTaxesChart
                        points={data.series.feesAndTaxes}
                        granularity={data.period.granularity}
                        animate={!isFetching}
                      />
                      <RealProfitTrendChart
                        points={data.series.realProfit}
                        granularity={data.period.granularity}
                        animate={!isFetching}
                      />
                    </>
                  )}
                </Box>
              </FadeUpRow>

              {/* ── Ce am făcut concret ── */}
              <FadeUpRow index={3}>
                <RidesHistoryTable
                  filters={filters}
                  uberConnected={sources?.uber.connected ?? false}
                  override={ridesOverride}
                />
              </FadeUpRow>

              {data?.uberIsMonthlyAggregate && (
                <Typography sx={{ fontSize: 12, color: HOME_TOKENS.text.tertiary }}>
                  Uber livrează doar totaluri lunare. În grafice, valorile lui sunt repartizate uniform
                  pe zilele perioadei; totalurile rămân exacte.
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Stack>
  )
}

/** Cont nou, fără nicio sursă conectată: pagina n-are ce afișa, deci nu afișează carduri goale. */
function EmptyAccountCard({
  onConnectBolt,
  onImportUber,
}: {
  onConnectBolt: () => void
  onImportUber: () => void
}) {
  return (
    <HomeCard title="Conectează o sursă ca să vezi datele">
      <Stack spacing={2} sx={{ py: 3, alignItems: 'center', textAlign: 'center' }}>
        <Typography sx={{ fontSize: 14, color: HOME_TOKENS.text.secondary, maxWidth: 420 }}>
          Conectează contul Bolt sau încarcă un raport Uber. Dashboardul se completează singur, iar taxele
          estimate apar imediat ce există prima cursă.
        </Typography>
        <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={onConnectBolt}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: HOME_TOKENS.radius.input,
              bgcolor: HOME_TOKENS.brand[600],
            }}
          >
            Conectează Bolt
          </Button>
          <Button
            variant="outlined"
            onClick={onImportUber}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: HOME_TOKENS.radius.input,
              borderColor: HOME_TOKENS.border.strong,
              color: HOME_TOKENS.text.primary,
            }}
          >
            Încarcă raport Uber
          </Button>
        </Stack>
      </Stack>
    </HomeCard>
  )
}
