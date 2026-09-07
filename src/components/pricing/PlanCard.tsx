import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Box, Button, Paper, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

import { TOKENS } from '../../constants/tokens'

/** Umbrele de accent ale cardului. Nu sunt în TOKENS: le folosește doar alegerea planului. */
const SELECTED_GLOW = '0 8px 40px rgba(92,203,245,0.28)'
const HIGHLIGHT_GLOW = '0 4px 24px rgba(92,203,245,0.18)'

/**
 * Cardul de plan din alegerea abonamentului.
 *
 * Trăiește separat fiindcă îl folosesc două fluxuri — alegerea planului PFA și pasul de abonament
 * din înrolarea de flotă. Flota își desena propriul card: alt titlu, alt preț, altă listă, deci
 * același pas arăta diferit în funcție de tipul de cont.
 *
 * Ce diferă între fluxuri intră prin sloturi: prețul (PFA are trei planuri cu reduceri care se
 * compun, flota are un plan cu două cicluri) și blocul de sub el (bifa BCR la PFA, starea
 * eligibilității la flotă). Restul e identic prin construcție.
 */
export interface PlanCardProps {
  title: string
  /** Blocul de preț. De obicei `PlanPrice`. */
  price: ReactNode
  /** Nota italică de sub preț: „Facturat lunar", „Primul an inclus". */
  priceNote?: string
  /** Bifa BCR, alertele de eligibilitate — ce ține de reducere, nu de plan. */
  belowPrice?: ReactNode
  summary?: string
  /** Rândul de deasupra listei: „Include tot ce ai în Start, plus:". */
  intro?: string
  features: string[]
  footnote?: string
  cta: string
  selected: boolean
  /** Cardul recomandat primește insigna „Cel mai popular" și o bordură accentuată. */
  highlighted?: boolean
  onSelect: () => void
  disabled?: boolean
}

export function PlanCard({
  title,
  price,
  priceNote,
  belowPrice,
  summary,
  intro,
  features,
  footnote,
  cta,
  selected,
  highlighted = false,
  onSelect,
  disabled = false,
}: PlanCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={disabled ? undefined : onSelect}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: TOKENS.radius.xl,
        cursor: disabled ? 'default' : 'pointer',
        border: selected
          ? `2px solid ${TOKENS.primary}`
          : highlighted
            ? `2px solid ${alpha(TOKENS.primary, 0.35)}`
            : `1px solid ${TOKENS.border}`,
        // Cardul ales iese mai tare decât cel recomandat: alegerea proprie bate sugestia.
        boxShadow: selected ? SELECTED_GLOW : highlighted ? HIGHLIGHT_GLOW : TOKENS.shadow.sm,
        backgroundColor: selected ? alpha(TOKENS.primary, 0.04) : TOKENS.paper,
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...(disabled
          ? {}
          : {
              '&:hover': {
                boxShadow: HIGHLIGHT_GLOW,
                borderColor: TOKENS.primary,
                transform: 'translateY(-3px)',
              },
            }),
      }}
    >
      {highlighted && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 2,
            py: 0.5,
            borderRadius: TOKENS.radius.full,
            backgroundColor: TOKENS.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <StarRoundedIcon sx={{ fontSize: 13, color: '#fff' }} />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>
            Cel mai popular
          </Typography>
        </Box>
      )}

      {selected && (
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: TOKENS.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />
        </Box>
      )}

      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: TOKENS.ink, mb: 0.5 }}>
          {title}
        </Typography>
        {price}
        {priceNote && (
          <Typography
            sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.5, fontStyle: 'italic' }}
          >
            {priceNote}
          </Typography>
        )}
        {belowPrice}
      </Box>

      {summary && (
        <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', lineHeight: 1.65 }}>
          {summary}
        </Typography>
      )}

      {intro && (
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: TOKENS.ink }}>
          {intro}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flexGrow: 1 }}>
        {features.map((point) => (
          <Box
            key={point}
            sx={{ display: 'flex', flexDirection: 'row', gap: 1.2, alignItems: 'flex-start' }}
          >
            <CheckCircleOutlineRoundedIcon
              sx={{ color: TOKENS.primary, fontSize: 17, flexShrink: 0, mt: 0.15 }}
            />
            <Typography
              sx={{ fontSize: '0.88rem', color: alpha(TOKENS.ink, 0.82), lineHeight: 1.55 }}
            >
              {point}
            </Typography>
          </Box>
        ))}
      </Box>

      {footnote && (
        <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, fontStyle: 'italic' }}>
          {footnote}
        </Typography>
      )}

      <Button
        variant={selected ? 'contained' : 'outlined'}
        fullWidth
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        sx={{
          mt: 1,
          py: 1.2,
          fontWeight: 700,
          fontSize: '0.95rem',
          borderRadius: TOKENS.radius.md,
          borderColor: selected ? 'transparent' : TOKENS.borderHover,
          color: selected ? '#fff' : TOKENS.ink,
          backgroundColor: selected ? TOKENS.primary : 'transparent',
          '&:hover': {
            backgroundColor: selected ? TOKENS.primaryStrong : alpha(TOKENS.primary, 0.06),
            borderColor: TOKENS.primary,
            color: selected ? '#fff' : TOKENS.primary,
          },
        }}
      >
        {selected ? '✓ Selectat' : cta}
      </Button>
    </Paper>
  )
}
