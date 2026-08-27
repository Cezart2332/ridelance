import { useEffect, useMemo, useState } from 'react'
import { Box, CircularProgress, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { PageHeader, StatusChip, formatLei, type StatusTone } from '../../ui'
import { tabularNums } from '../../home/tokens'
import { FilterBar } from '../../home/components/FilterBar'
import { useDashboardFilters } from '../../home/useDashboardFilters'
import { useDashboardSummary } from '../../home/useDashboardData'
import { taxObligationsService, type TaxObligation } from '../../../../services/taxObligations.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { openDocument } from '../../../common/documentViewerBus'

const STATUS_TONE: Record<TaxObligation['status'], StatusTone> = {
  InPregatire: 'neutral',
  Depusa: 'neutral',
  DePlata: 'neutral',
  Platita: 'active',
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return day && month && year ? `${day}.${month}.${year}` : value
}

/**
 * Contabilitate → Taxe & declarații.
 *
 * Cele două zone nu se amestecă niciodată, pentru că nu sunt același lucru: sus sunt cifre
 * pe care le calculează platforma și care se schimbă cu fiecare cursă, jos sunt sume pe care
 * contabila le-a declarat la ANAF și pe care chiar trebuie să le plătești. Un utilizator
 * trebuie să poată spune care e care fără să citească documentație (spec §7.3).
 */
export function TaxesPage() {
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

  const { data, isLoading } = useDashboardSummary(query)

  const [obligations, setObligations] = useState<{ items: TaxObligation[]; error: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    taxObligationsService
      .getAll()
      .then((items) => {
        if (!cancelled) setObligations({ items: items ?? [], error: null })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setObligations({ items: [], error: getErrorMessage(cause, 'Nu am putut încărca declarațiile.') })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reserve = data?.taxReserve

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Taxe & declarații"
        subtitle="Estimările RIDElance și declarațiile depuse de contabilă, separate."
      />

      {/* ── A. Estimări RIDElance ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px dashed ${alpha(DASHBOARD_TOKENS.ink, 0.18)}`,
          bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.015),
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Estimări RIDElance</Typography>
          <StatusChip tone="neutral" label="Estimare" size="sm" />
        </Stack>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
          Calculate de platformă din activitatea ta. Sunt orientative și se schimbă pe măsură ce
          lucrezi — nu sunt sume declarate.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FilterBar
            filters={filters}
            onPeriodChange={setPeriod}
            onCustomRangeChange={setCustomRange}
            onPlatformChange={setPlatform}
            onPaymentChange={setPayment}
            onReset={reset}
          />
        </Box>

        {isLoading || !reserve ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : (
          <Box>
            {reserve.components.map((component) => (
              <Stack
                key={component.key}
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                  py: 1.2,
                  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
                }}
              >
                <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem' }}>
                    {component.label}
                  </Typography>
                  {component.note && (
                    <Tooltip title={component.note} enterTouchDelay={0}>
                      <InfoOutlinedIcon
                        tabIndex={0}
                        aria-label={component.note}
                        sx={{ fontSize: 14, color: DASHBOARD_TOKENS.textSubtle }}
                      />
                    </Tooltip>
                  )}
                </Stack>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.9rem', ...tabularNums }}>
                  {formatLei(component.amount)}
                </Typography>
              </Stack>
            ))}

            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 2, pt: 1.6 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.9rem' }}>
                Total recomandat de pus deoparte
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.05rem', ...tabularNums }}>
                {formatLei(reserve.total)}
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── B. Declarații depuse de contabilă ── */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
            Declarații depuse de contabilă
          </Typography>
          <StatusChip tone="active" label="Obligație reală" size="sm" />
        </Stack>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
          Sume stabilite și declarate de contabila ta. Acestea se plătesc până la termenul afișat.
        </Typography>

        {obligations === null ? (
          <Stack sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : obligations.error ? (
          <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.86rem' }}>
            {obligations.error}
          </Typography>
        ) : obligations.items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              bgcolor: DASHBOARD_TOKENS.paper,
            }}
          >
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 750 }}>
              Nicio declarație depusă încă
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.5 }}>
              Aici vor apărea declarațiile pe care le depune contabila ta, cu sumă și termen.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {obligations.items.map((obligation) => (
              <Paper
                key={obligation.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: DASHBOARD_TOKENS.radius.lg,
                  border: `1px solid ${obligation.isOverdue ? alpha(DASHBOARD_TOKENS.stateError, 0.35) : DASHBOARD_TOKENS.border}`,
                  boxShadow: DASHBOARD_TOKENS.shadow.sm,
                  bgcolor: DASHBOARD_TOKENS.paper,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
                      {obligation.typeLabel}
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem' }}>
                      {obligation.periodLabel}
                    </Typography>
                  </Box>
                  <StatusChip tone={STATUS_TONE[obligation.status]} label={obligation.statusLabel} size="sm" />
                </Stack>

                <Stack spacing={0.8} sx={{ mt: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
                      Sumă de plată
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.95rem', ...tabularNums }}>
                      {formatLei(obligation.amountDue)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Termen</Typography>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: obligation.isOverdue ? DASHBOARD_TOKENS.stateError : DASHBOARD_TOKENS.ink,
                        ...tabularNums,
                      }}
                    >
                      {formatDate(obligation.dueDate)}
                    </Typography>
                  </Stack>
                </Stack>

                {obligation.isOverdue && (
                  <Typography sx={{ color: DASHBOARD_TOKENS.stateError, fontSize: '0.82rem', fontWeight: 700, mt: 1.2 }}>
                    Termen depășit
                  </Typography>
                )}

                {obligation.note && (
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 1.2 }}>
                    {obligation.note}
                  </Typography>
                )}

                {obligation.documentId && (
                  <Stack
                    direction="row"
                    spacing={0.6}
                    component="button"
                    onClick={() =>
                      openDocument(obligation.documentId!, `${obligation.typeLabel}.pdf`)
                    }
                    sx={{
                      mt: 1.6,
                      alignItems: 'center',
                      border: 'none',
                      background: 'none',
                      p: 0,
                      cursor: 'pointer',
                      color: DASHBOARD_TOKENS.primaryStrong,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    <DescriptionRoundedIcon sx={{ fontSize: 16 }} />
                    Vezi document
                  </Stack>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Stack>
  )
}
