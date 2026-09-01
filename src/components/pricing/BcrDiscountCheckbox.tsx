import { Box, Checkbox, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { TOKENS } from '../../constants/tokens'
import { BCR_DISCOUNT_INFO, BCR_DISCOUNT_LABEL } from '../../data/bcrDiscount'

/**
 * Înălțimea unui rând de etichetă, în pixeli.
 *
 * Toate cele trei elemente o primesc, ca să se alinieze pe prima linie chiar și când textul se
 * rupe pe două rânduri. Scrisă o dată, nu ghicită de trei ori cu marginile negative.
 */
const ROW = 18

/**
 * Bifa pentru reducerea BCR, sub prețul fiecărui plan.
 *
 * Aceeași stare pe toate cardurile: reducerea nu ține de plan, e aceeași sumă oriunde. O bifă
 * separată per card ar fi sugerat că se poate cere doar pentru unul.
 *
 * Caseta, textul și „i" stau pe aceeași linie prin construcție: toate trei primesc înălțimea unui
 * rând de text (`ROW`). Fără asta, caseta MUI vine cu padding propriu și o cutie de 26 px, iar
 * glifa se centrează în ea — adică vizibil mai jos decât prima linie a etichetei.
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
      spacing={0.7}
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
          // Fără padding și cu glifa exact cât rândul: atât cutia, cât și semnul din ea ajung la
          // înălțimea primei linii de text, deci `flex-start` le pune cu adevărat pe aceeași linie.
          p: 0,
          width: ROW,
          height: ROW,
          flexShrink: 0,
          color: alpha(TOKENS.ink, 0.35),
          '&.Mui-checked': { color: TOKENS.primaryStrong },
          '& .MuiSvgIcon-root': { fontSize: ROW },
        }}
      />

      <Typography
        component="label"
        sx={{
          fontSize: '0.76rem',
          fontWeight: 650,
          // În pixeli, nu ca multiplu: aceeași valoare ca înălțimea casetei, altfel cele două se
          // despart din nou la prima schimbare de mărime a fontului.
          lineHeight: `${ROW}px`,
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
            // Aceeași înălțime de rând ca celelalte două: iconița de 15px se centrează în ea și
            // cade pe mijlocul primei linii, fără margine ghicită.
            height: ROW,
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
