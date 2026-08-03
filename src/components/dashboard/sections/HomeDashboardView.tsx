import { useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import GaugeIcon from '@mui/icons-material/SpeedRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import WalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'

import { HOME_TOKENS } from '../home/tokens'
import {
  formatCompact,
  formatDistance,
  formatHours,
  formatPeriodLabel,
  formatRate,
} from '../home/format'
import { useDashboardFilters } from '../home/useDashboardFilters'
import { useDashboardSummary } from '../home/useDashboardData'
import { exportRidesCsv } from '../home/exportRidesCsv'
import { FilterBar } from '../home/components/FilterBar'
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
import { SourcesPill } from '../home/components/SourcesPill'
import { isBoltStale, isUberStale } from '../home/sourceFreshness'
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
      onExport={() => exportRidesCsv(query)}
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
  onExport?: () => Promise<unknown> | void
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
  onExport,
  ridesOverride,
}: HomeDashboardContentProps) {
  const [staleBannerDismissed, setStaleBannerDismissed] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const periodLabel = formatPeriodLabel(filters.from, filters.to)
  const comparisonLabel = COMPARISON_LABELS[filters.period] ?? COMPARISON_LABELS.custom
  const goToSources = () => onNavigate?.('profile')

  const sources = data?.sources
  const noSources = !!sources && !sources.bolt.configured && !sources.uber.connected
  const showStaleBanner =
    !!sources && !staleBannerDismissed && (isBoltStale(sources) || isUberStale(sources))
  const onlyOneSource =
    !!sources && sources.bolt.configured !== sources.uber.connected && !noSources

  const handleExport = async () => {
    if (!onExport) return
    setIsExporting(true)
    try {
      await onExport()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Stack spacing={0} sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
      {/* ── Antet: unde ești, ce perioadă privești, starea surselor ── */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 1.4,
          pb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {/* Titlul paginii e deja în antetul aplicației; aici rămâne doar pentru
              cititoarele de ecran, ca perioada afișată să aibă un context citibil. */}
          <Typography
            component="h1"
            sx={visuallyHidden}
          >
            Acasă — {periodLabel}
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: HOME_TOKENS.text.primary }}>
            {periodLabel}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          {sources && <SourcesPill sources={sources} onOpenSources={goToSources} />}
          <Button
            variant="outlined"
            size="small"
            disabled={isExporting || !data || !onExport}
            startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderRadius: HOME_TOKENS.radius.input,
              borderColor: HOME_TOKENS.border.strong,
              color: HOME_TOKENS.text.primary,
              '&:hover': { borderColor: HOME_TOKENS.text.secondary, bgcolor: HOME_TOKENS.bg.surface2 },
            }}
          >
            {isExporting ? 'Se exportă…' : 'Exportă'}
          </Button>
        </Stack>
      </Stack>

      <FilterBar
        filters={filters}
        onPeriodChange={onPeriodChange}
        onCustomRangeChange={onCustomRangeChange}
        onPlatformChange={onPlatformChange}
        onPaymentChange={onPaymentChange}
        onReset={onReset}
      />

      <Stack spacing={3} sx={{ pt: 3 }}>
        {showStaleBanner && (
          <Alert
            severity="warning"
            variant="outlined"
            onClose={() => setStaleBannerDismissed(true)}
            sx={{
              borderRadius: HOME_TOKENS.radius.card,
              borderColor: HOME_TOKENS.warn[600],
              bgcolor: HOME_TOKENS.warn[50],
              fontSize: '0.83rem',
              '& .MuiAlert-icon': { color: HOME_TOKENS.warn[600] },
            }}
            action={
              <Button size="small" onClick={goToSources} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Deschide sursele
              </Button>
            }
          >
            Datele afișate pot fi în urmă — o sursă nu a mai fost actualizată de ceva vreme.
          </Alert>
        )}

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
              bgcolor: HOME_TOKENS.bg.surface2,
              border: `1px solid ${HOME_TOKENS.border.subtle}`,
              color: HOME_TOKENS.text.secondary,
              fontSize: '0.78rem',
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
            <Stack spacing={3}>
              {/* ── Rând A: cele șase cifre ── */}
              <FadeUpRow index={0}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(3, minmax(0, 1fr))',
                      xl: 'repeat(6, minmax(0, 1fr))',
                    },
                  }}
                >
                  {isLoading || !data
                    ? Array.from({ length: 6 }).map((_, index) => <TileSkeleton key={index} />)
                    : [
                        <KpiTile
                          key="net"
                          icon={WalletRoundedIcon}
                          label="Încasări nete"
                          metric={data.kpis.netEarnings}
                          format={formatCompact}
                          subtext="după comisioane platforme"
                          tone="positive"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="fees"
                          icon={PercentRoundedIcon}
                          label="Comision platforme"
                          metric={data.kpis.platformFees}
                          format={formatCompact}
                          subtext="reținut de Bolt și Uber"
                          tone="negative"
                          invertDelta
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="hours"
                          icon={ScheduleRoundedIcon}
                          label="Ore online"
                          metric={data.kpis.onlineHours}
                          format={formatHours}
                          subtext="timp activ raportat de platforme"
                          tone="neutral"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="km"
                          icon={RouteRoundedIcon}
                          label="Km în cursă"
                          metric={data.kpis.rideKm}
                          format={formatDistance}
                          subtext="doar km cu pasager"
                          tone="neutral"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="perHour"
                          icon={TrendingUpRoundedIcon}
                          label="Net / oră"
                          metric={data.kpis.netPerHour}
                          format={(value) => formatRate(value, 'h')}
                          subtext="încasări nete ÷ ore online"
                          tone="brand"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="perKm"
                          icon={GaugeIcon}
                          label="Net / km"
                          metric={data.kpis.netPerKm}
                          format={(value) => formatRate(value, 'km')}
                          subtext="încasări nete ÷ km în cursă"
                          tone="brand"
                          comparisonLabel={comparisonLabel}
                        />,
                      ]}
                </Box>
              </FadeUpRow>

              {/* ── Rând B: ce e al meu, ce nu e al meu ── */}
              <FadeUpRow index={1}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <CardSkeleton height={380} />
                      <CardSkeleton height={380} />
                    </>
                  ) : (
                    <>
                      <TaxReserveCard
                        reserve={data.taxReserve}
                        periodLabel={periodLabel}
                        onOpenExpenses={onNavigate ? () => onNavigate('expenses') : undefined}
                      />
                      <RealProfitCard profit={data.realProfit} />
                    </>
                  )}
                </Box>
              </FadeUpRow>

              {/* ── Rând C: cum a evoluat, de unde a venit ── */}
              <FadeUpRow index={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <CardSkeleton height={340} />
                      <CardSkeleton height={340} />
                    </>
                  ) : (
                    <>
                      <NetEarningsChart
                        points={data.series.netEarnings}
                        total={data.kpis.netEarnings.value}
                        granularity={data.period.granularity}
                        animate={!isFetching}
                      />
                      <PlatformBreakdown rows={data.platformSplit} animate={!isFetching} />
                    </>
                  )}
                </Box>
              </FadeUpRow>

              {/* ── Rând D: unde se duc banii, ce rămâne ── */}
              <FadeUpRow index={3}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <CardSkeleton height={300} />
                      <CardSkeleton height={300} />
                    </>
                  ) : (
                    <>
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

              {/* ── Rând E: ce am făcut concret ── */}
              <FadeUpRow index={4}>
                <RidesHistoryTable
                  filters={filters}
                  uberConnected={sources?.uber.connected ?? false}
                  override={ridesOverride}
                />
              </FadeUpRow>

              {data?.uberIsMonthlyAggregate && (
                <Typography sx={{ fontSize: '0.74rem', color: HOME_TOKENS.text.tertiary }}>
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
        <Typography sx={{ fontSize: '0.88rem', color: HOME_TOKENS.text.secondary, maxWidth: 420 }}>
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
