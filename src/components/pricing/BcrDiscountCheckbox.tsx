import { Box, Checkbox, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { TOKENS } from '../../constants/tokens'
import { BCR_DISCOUNT_INFO, BCR_DISCOUNT_LABEL } from '../../data/bcrDiscount'

/**
 * Bifa pentru reducerea BCR, sub prețul fiecărui plan.
 *
 * Aceeași stare pe toate cardurile: reducerea nu ține de plan, e aceeași sumă oriunde. O bifă
 * separată per card ar fi sugerat că se poate cere doar pentru unul.
 *
 * Prețul afișat rămâne neatins când se bifează. Reducerea pornește abia după confirmarea BCR,
 * deci o cifră tăiată aici ar fi fost o promisiune pe care plata de a doua zi n-o respectă. Ce se
 * întâmplă și când se întâmplă stă în „i", nu în preț.
 */

interface BcrDiscountCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Cardurile din aplicație sunt ele însele apăsabile; bifa nu are voie să le schimbe selecția. */
  stopPropagation?: boolean
  align?: 'left' | 'center'
}

export function BcrDiscountCheckbox({
  checked,
  onChange,
  stopPropagation = false,
  align = 'left',
}: BcrDiscountCheckboxProps) {
  return (
    <Stack
      direction="row"
      spacing={0.3}
      onClick={stopPropagation ? (event) => event.stopPropagation() : undefined}
      sx={{
        alignItems: 'flex-start',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        mt: 1.2,
        textAlign: 'left',
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        slotProps={{ input: { 'aria-label': BCR_DISCOUNT_LABEL } }}
        sx={{
          p: 0.4,
          mt: '-2px',
          color: alpha(TOKENS.ink, 0.35),
          '&.Mui-checked': { color: TOKENS.primaryStrong },
        }}
      />

      <Typography
        component="label"
        sx={{
          fontSize: '0.76rem',
          fontWeight: 650,
          lineHeight: 1.45,
          color: TOKENS.textMuted,
          cursor: 'default',
        }}
      >
        {BCR_DISCOUNT_LABEL}
      </Typography>

      <Tooltip title={BCR_DISCOUNT_INFO} enterTouchDelay={0} leaveTouchDelay={6000} arrow>
        {/* `tabIndex` pe un Box, nu un IconButton: butonul ar fi adus cu el o zonă de atingere de
            34px și un efect de apăsare, adică greutatea unei acțiuni. Aici nu se întâmplă nimic
            la click — doar se explică. */}
        <Box
          component="span"
          tabIndex={0}
          aria-label="Detalii despre reducerea BCR"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            mt: '1px',
            cursor: 'help',
            color: TOKENS.textSubtle,
            '&:hover, &:focus-visible': { color: TOKENS.primaryStrong },
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
        </Box>
      </Tooltip>
    </Stack>
  )
}
