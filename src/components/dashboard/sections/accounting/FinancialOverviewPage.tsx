import { useMemo } from 'react'
import { Box, Stack } from '@mui/material'

import { SPLIT_ROW } from '../../home/tokens'
import { comparisonLabelFor, selectFinancialBreakdown } from '../../home/selectors'
import { useDashboardFilters } from '../../home/useDashboardFilters'
import { useDashboardSummary } from '../../home/useDashboardData'
import { DashboardHeader } from '../../home/components/DashboardHeader'
import { FadeUpRow } from '../../home/components/FadeUpRow'
import { HomeCard } from '../../home/components/HomeCard'
import { KpiTile } from '../../home/components/KpiTile'
import { PlatformBreakdown } from '../../home/components/PlatformBreakdown'
import { RealProfitCard } from '../../home/components/RealProfitCard'
import { CardError, CardSkeleton, TileSkeleton } from '../../home/components/states/CardStates'
import { FinancialTrendChart } from '../../home/components/charts/FinancialTrendChart'

const GRID_GAP = 2

/**
 * Contabilitate → Situație financiară.
 *
 * Aceleași cifre ca pe Acasă, dar organizate exclusiv financiar: Acasă răspunde la „cum
 * merge activitatea", pagina asta la „cum stau cu banii". Nimic nu se recalculează — cifrele
 * vin din același `useDashboardSummary`, iar tot ce nu e citit direct din DTO trece prin
 * `selectFinancialBreakdown`, împărțit cu Acasă.
 *
 * Ce lipsește față de Acasă e intenționat: ore online, km, net/oră, net/km și istoricul de
 * curse sunt despre activitate, nu despre bani.
 */
export function FinancialOverviewPage() {
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
  const breakdown = data ? selectFinancialBreakdown(data.realProfit) : null
  const comparisonLabel = comparisonLabelFor(filters.period)

  return (
    <Stack spacing={0} sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>
      <DashboardHeader
        filters={filters}
        sources={data?.sources ?? null}
        onOpenSources={() => {}}
        onPeriodChange={setPeriod}
        onCustomRangeChange={setCustomRange}
        onPlatformChange={setPlatform}
        onPaymentChange={setPayment}
        onReset={reset}
      />

      <Stack spacing={GRID_GAP} sx={{ pt: GRID_GAP }}>
        {error && !data ? (
          <HomeCard title="Nu am putut încărca situația financiară">
            <CardError message={error} onRetry={reload} />
          </HomeCard>
        ) : (
          <Box sx={{ opacity: isFetching && data ? 0.6 : 1, transition: 'opacity 150ms ease-out' }}>
            <Stack spacing={GRID_GAP}>
              {/* ── Cifrele, toate financiare ── */}
              <FadeUpRow index={0}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: GRID_GAP,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      lg: 'repeat(5, minmax(0, 1fr))',
                    },
                  }}
                >
                  {isLoading || !data || !breakdown
                    ? Array.from({ length: 5 }).map((_, index) => <TileSkeleton key={index} />)
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
                          key="profit"
                          label="Profit real estimat"
                          metric={{ value: breakdown.realProfit, previous: null }}
                          unit="lei"
                          subtext="după cheltuieli și taxe estimate"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="expenses"
                          label="Cheltuieli deductibile"
                          metric={{ value: breakdown.deductibleExpenses, previous: null }}
                          unit="lei"
                          subtext="doar cu documentul verificat"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="taxes"
                          label="Taxe estimate"
                          metric={{ value: breakdown.estimatedTaxes, previous: null }}
                          unit="lei"
                          subtext="estimare RIDElance, nu obligație"
                          comparisonLabel={comparisonLabel}
                        />,
                        <KpiTile
                          key="available"
                          label="Bani disponibili după taxe"
                          metric={{ value: breakdown.availableAfterTaxes, previous: null }}
                          unit="lei"
                          subtext="încasări nete − taxe estimate"
                          comparisonLabel={comparisonLabel}
                        />,
                      ]}
                </Box>
              </FadeUpRow>

              {/* ── Evoluția, cu seriile comutabile ── */}
              <FadeUpRow index={1}>
                {isLoading || !data ? (
                  <CardSkeleton height={360} />
                ) : (
                  <FinancialTrendChart
                    points={data.series.realProfit}
                    granularity={data.period.granularity}
                    animate={!isFetching}
                  />
                )}
              </FadeUpRow>

              {/* ── Cascada profitului lângă sursele banilor ── */}
              <FadeUpRow index={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: GRID_GAP,
                    gridTemplateColumns: '1fr',
                    [SPLIT_ROW]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  {isLoading || !data ? (
                    <>
                      <CardSkeleton height={320} />
                      <CardSkeleton height={320} />
                    </>
                  ) : (
                    <>
                      <RealProfitCard profit={data.realProfit} />
                      <PlatformBreakdown rows={data.platformSplit} animate={!isFetching} />
                    </>
                  )}
                </Box>
              </FadeUpRow>
            </Stack>
          </Box>
        )}
      </Stack>
    </Stack>
  )
}
