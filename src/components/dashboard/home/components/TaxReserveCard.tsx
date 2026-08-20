import { Box, Stack, Tooltip, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

import { HOME_TOKENS, tabularNums } from '../tokens'
import { formatCurrency, formatFiscalMonth, formatPercent } from '../format'
import type { TaxReserve } from '../../../../services/pfaDashboard.service'
import { TAX_RAMP } from './charts/chartTheme'
import { Amount } from '../../ui/Amount'
import { HomeCard } from './HomeCard'

/**
 * Toate cele patru componente sunt obligații către stat, deci aceeași familie cromatică:
 * se disting prin luminozitate, nu prin hue. Înainte, impozitul și contribuțiile erau
 * albastre, ceea ce le scotea din categoria „fiscalitate" exact în cardul despre fiscalitate.
 * Legenda e chiar tabelul de dedesubt.
 */
const COMPONENT_COLORS: Record<string, string> = {
  vatIntracom: TAX_RAMP[0],
  boltNonResident: TAX_RAMP[1],
  incomeTax: TAX_RAMP[2],
  casCass: TAX_RAMP[3],
}

interface TaxReserveCardProps {
  reserve: TaxReserve
  periodLabel: string
  onOpenExpenses?: () => void
}

/**
 * „Cât trebuie să pui deoparte" — informativ, nu alarmă. Toate cotele vin din backend
 * împreună cu baza de calcul; frontendul nu conține nicio constantă fiscală.
 */
export function TaxReserveCard({ reserve, periodLabel, onOpenExpenses }: TaxReserveCardProps) {
  const total = reserve.total
  const segments = reserve.components.filter((component) => component.amount > 0)
  const showFiscalMonthContext = reserve.scope === 'period'

  return (
    <HomeCard
      title="Cât trebuie să pui deoparte"
      hint="Estimare pe perioada selectată: TVA intracomunitar și taxa de nerezident se calculează din comisioanele platformelor, iar impozitul și contribuțiile din cota anuală estimată, alocată perioadei."
      accent={HOME_TOKENS.warn[600]}
    >
      <Amount value={total} unit="lei" size="hero" />
      <Typography sx={{ fontSize: 12, color: HOME_TOKENS.text.tertiary, mt: 0.3 }}>
        recomandare rezervă taxe — {periodLabel}
      </Typography>

      {showFiscalMonthContext && (
        <Tooltip
          enterTouchDelay={0}
          title="TVA-ul intracomunitar se declară pe lună calendaristică. Sub perioada selectată vezi și referința lunii întregi."
        >
          <Typography
            tabIndex={0}
            sx={{
              display: 'inline-block',
              mt: 0.8,
              fontSize: '0.75rem',
              color: HOME_TOKENS.text.secondary,
              borderBottom: `1px dashed ${HOME_TOKENS.border.strong}`,
              cursor: 'help',
              '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
            }}
          >
            Raportare lunară: {formatFiscalMonth(reserve.fiscalMonth.month)} —{' '}
            <Box component="span" sx={tabularNums}>
              {formatCurrency(reserve.fiscalMonth.total)}
            </Box>
          </Typography>
        </Tooltip>
      )}

      {/* Bara stacked arată proporția celor patru componente fără să ceară un click. */}
      <Box
        role="img"
        aria-label={`Structura rezervei: ${reserve.components
          .map((component) => `${component.label} ${formatCurrency(component.amount)}`)
          .join(', ')}`}
        sx={{
          display: 'flex',
          height: 10,
          mt: 2,
          borderRadius: HOME_TOKENS.radius.pill,
          overflow: 'hidden',
          bgcolor: HOME_TOKENS.bg.surface2,
        }}
      >
        {total > 0 &&
          segments.map((component) => (
            <Box
              key={component.key}
              sx={{
                width: `${(component.amount / total) * 100}%`,
                bgcolor: COMPONENT_COLORS[component.key] ?? HOME_TOKENS.text.tertiary,
              }}
            />
          ))}
      </Box>

      <Stack spacing={0} sx={{ mt: 1.6 }}>
        {reserve.components.map((component) => (
          <Stack
            key={component.key}
            direction="row"
            spacing={1.2}
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 0.85,
              '&:not(:last-of-type)': { borderBottom: `1px solid ${HOME_TOKENS.border.subtle}` },
            }}
          >
            <Stack direction="row" spacing={0.9} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: COMPONENT_COLORS[component.key] ?? HOME_TOKENS.text.tertiary,
                }}
              />
              <Tooltip title={component.note ?? ''} enterTouchDelay={0} disableHoverListener={!component.note}>
                <Typography
                  noWrap
                  sx={{ fontSize: '0.83rem', color: HOME_TOKENS.text.secondary, cursor: component.note ? 'help' : 'default' }}
                >
                  {component.label}
                  {component.rate !== null && (
                    <Box component="span" sx={{ color: HOME_TOKENS.text.tertiary, ml: 0.6 }}>
                      {formatPercent(component.rate)}
                    </Box>
                  )}
                </Typography>
              </Tooltip>
            </Stack>
            <Amount
              value={component.amount}
              unit="lei"
              size="row"
              weight={500}
              sx={{ flexShrink: 0 }}
            />
          </Stack>
        ))}
      </Stack>

      {onOpenExpenses && (
        <Box
          component="button"
          type="button"
          onClick={onOpenExpenses}
          sx={{
            mt: 1.6,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            border: 'none',
            background: 'none',
            p: 0,
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: HOME_TOKENS.brand[600],
            '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
          }}
        >
          Vezi calculul detaliat
          <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
        </Box>
      )}
    </HomeCard>
  )
}
