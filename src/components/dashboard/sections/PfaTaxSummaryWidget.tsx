import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import CancelOutlinedRoundedIcon from '@mui/icons-material/CancelOutlined'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { type DashboardSummary, type YtdExpenseItem } from '../../../services/user.service'
import { monthNumberToLabel } from '../../../utils/monthLabels'

// ─── helpers ─────────────────────────────────────────────────────────────────

function lei(value: number) {
  return `${Math.round(value).toLocaleString('ro-RO')} lei`
}

function pct(part: number, total: number) {
  if (total === 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

function statusChip(status: string) {
  const s = status.toLowerCase()
  if (s === 'verified') {
    return (
      <Chip
        icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: '12px !important' }} />}
        label="Verificat"
        size="small"
        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#059669' }}
      />
    )
  }
  if (s === 'pending') {
    return (
      <Chip
        icon={<HourglassEmptyRoundedIcon sx={{ fontSize: '12px !important' }} />}
        label="In verificare"
        size="small"
        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#f59e0b', 0.12), color: '#b45309' }}
      />
    )
  }
  return (
    <Chip
      icon={<CancelOutlinedRoundedIcon sx={{ fontSize: '12px !important' }} />}
      label="Respins"
      size="small"
      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha('#ef4444', 0.1), color: '#dc2626' }}
    />
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface TaxBarProps {
  label: string
  value: number
  total: number
  color: string
  tooltip?: string
}

function TaxBar({ label, value, total, color, tooltip }: TaxBarProps) {
  const progress = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <Tooltip title={tooltip ?? ''} placement="right">
      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
            {lei(value)}
            <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, color: DASHBOARD_TOKENS.textSubtle, ml: 0.5 }}>
              ({pct(value, total)})
            </Typography>
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 4,
            bgcolor: alpha(color, 0.12),
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
          }}
        />
      </Box>
    </Tooltip>
  )
}

// ─── main widget ─────────────────────────────────────────────────────────────

interface PfaTaxSummaryWidgetProps {
  summary: DashboardSummary
}

export function PfaTaxSummaryWidget({ summary }: PfaTaxSummaryWidgetProps) {
  const [expandExpenses, setExpandExpenses] = useState(false)

  const {
    taxYear,
    ytdTotalIncome,
    ytdDeductibleExpenses,
    ytdProfit,
    ytdCas,
    ytdCass,
    ytdIncomeTax,
    ytdTotalTax,
    ytdNetIncome,
    ytdExpenses,
  } = summary

  const hasData = ytdTotalIncome > 0



  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.2)}`,
        background: `linear-gradient(145deg, ${alpha(DASHBOARD_TOKENS.primary, 0.04)} 0%, ${DASHBOARD_TOKENS.paper} 60%)`,
        boxShadow: DASHBOARD_TOKENS.shadow.md,
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Box
          sx={{
            p: 1.2,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountBalanceRoundedIcon sx={{ fontSize: 22, color: DASHBOARD_TOKENS.primaryStrong }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: DASHBOARD_TOKENS.ink }}>
            Estimare fiscală {taxYear}
          </Typography>

        </Box>
      </Stack>

      {!hasData ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px dashed ${DASHBOARD_TOKENS.border}`,
            textAlign: 'center',
          }}
        >
          <TrendingUpRoundedIcon sx={{ fontSize: 32, color: DASHBOARD_TOKENS.textSubtle, mb: 1 }} />
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu există date de venit pentru {taxYear}. Contabilul tău va introduce veniturile lunare.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          {/* Left column — income & tax breakdown */}
          <Stack spacing={2}>
            {/* Summary numbers */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              {[
                { label: 'Venit brut anual', value: ytdTotalIncome, accent: false },
                { label: 'Cheltuieli deductibile', value: ytdDeductibleExpenses, accent: false },
                { label: 'Profit impozabil', value: ytdProfit, accent: false },
                { label: 'Total taxe estimate', value: ytdTotalTax, accent: true },
              ].map(({ label, value, accent }) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: DASHBOARD_TOKENS.radius.lg,
                    border: `1px solid ${accent ? alpha(DASHBOARD_TOKENS.primary, 0.25) : DASHBOARD_TOKENS.border}`,
                    bgcolor: accent ? alpha(DASHBOARD_TOKENS.primary, 0.05) : DASHBOARD_TOKENS.surface,
                  }}
                >
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, mb: 0.4 }}>
                    {label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: accent ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.ink,
                      letterSpacing: -0.3,
                    }}
                  >
                    {lei(value)}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Tax bars */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: DASHBOARD_TOKENS.radius.lg,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                bgcolor: DASHBOARD_TOKENS.surface,
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, mb: 1.8, color: DASHBOARD_TOKENS.ink }}>
                Taxe
              </Typography>
              <Stack spacing={1.6}>
                <TaxBar
                  label="CAS (25%)"
                  value={ytdCas}
                  total={ytdTotalIncome}
                  color="#3b82f6"
                  tooltip="Contribuție la pensie (asigurări sociale)"
                />
                <TaxBar
                  label="CASS (10%)"
                  value={ytdCass}
                  total={ytdTotalIncome}
                  color="#8b5cf6"
                  tooltip="Contribuție la sănătate (asigurare socială de sănătate)"
                />
                <TaxBar
                  label="Impozit venit (10%)"
                  value={ytdIncomeTax}
                  total={ytdTotalIncome}
                  color="#f59e0b"
                  tooltip="Impozit pe venitul net (după deducerea CAS și CASS)"
                />
              </Stack>
            </Paper>
          </Stack>

          {/* Right column — net income & expenses */}
          <Stack spacing={2}>
            {/* Net income highlight */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: DASHBOARD_TOKENS.radius.xl,
                border: `1px solid ${alpha('#10b981', 0.25)}`,
                background: `linear-gradient(135deg, ${alpha('#10b981', 0.08)} 0%, ${DASHBOARD_TOKENS.paper} 70%)`,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', mb: 0.5 }}>
                Venit net estimat ({taxYear})
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '2rem',
                  color: '#047857',
                  letterSpacing: -1,
                }}
              >
                {lei(ytdNetIncome)}
              </Typography>

            </Paper>

            {/* Expenses summary */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: DASHBOARD_TOKENS.radius.lg,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                overflow: 'hidden',
              }}
            >
              <Accordion
                expanded={expandExpenses}
                onChange={() => setExpandExpenses(!expandExpenses)}
                elevation={0}
                disableGutters
                sx={{ bgcolor: 'transparent' }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon />}
                  sx={{ px: 2, py: 1.2, minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0.5 } }}
                >
                  <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                    <ReceiptLongRoundedIcon sx={{ fontSize: 18, color: DASHBOARD_TOKENS.primaryStrong }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                        Cheltuieli deductibile {taxYear}
                      </Typography>

                    </Box>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${DASHBOARD_TOKENS.border}` }}>
                  {ytdExpenses.length === 0 ? (
                    <Typography sx={{ p: 2, fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted }}>
                      Nicio cheltuială înregistrată pentru {taxYear}.
                    </Typography>
                  ) : (
                    <Stack>
                      {ytdExpenses.map((expense: YtdExpenseItem) => (
                        <Stack
                          key={expense.id}
                          direction="row"
                          sx={{
                            px: 2,
                            py: 1,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.border, 0.5)}`,
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }} noWrap>
                              {expense.itemName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: DASHBOARD_TOKENS.textMuted }}>
                              {monthNumberToLabel(expense.month)} · {expense.catalogCategory}
                              {expense.amountRon != null && expense.amountRon > 0
                                ? ` · ${expense.amountRon.toLocaleString('ro-RO')} lei`
                                : ''}
                            </Typography>
                          </Box>
                          <Box sx={{ ml: 1, flexShrink: 0 }}>
                            {statusChip(expense.documentStatus)}
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Stack>
        </Box>
      )}
    </Paper>
  )
}
