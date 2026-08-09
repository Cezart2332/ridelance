import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Button, Stack } from '@mui/material'

interface CardFooterProps {
  label?: string
  disabled?: boolean
  onContinue: () => void
}

/**
 * Footerul cardului: un singur buton, la dreapta.
 *
 * „Înapoi" stă în topbar — dublat în două locuri, niciunul nu mai e evident. Fără text ajutător
 * lângă buton: dacă butonul e activ se poate continua, dacă nu, ecranul arată deja ce lipsește.
 */
export function CardFooter({ label = 'Continuă', disabled, onContinue }: CardFooterProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        size="large"
        disabled={disabled}
        onClick={onContinue}
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {label}
      </Button>
    </Stack>
  )
}
