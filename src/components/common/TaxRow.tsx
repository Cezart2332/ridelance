import { Stack, Typography } from '@mui/material'
import { TOKENS } from '../../constants/tokens'

export function TaxRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Typography
        variant="body2"
        sx={{
          color: bold ? TOKENS.ink : TOKENS.textMuted,
          fontWeight: bold ? 650 : 400,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: highlight
            ? TOKENS.primaryStrong
            : bold
              ? TOKENS.ink
              : TOKENS.textMain,
          fontWeight: bold ? 700 : 600,
          textAlign: 'right',
        }}
      >
        {value}
      </Typography>
    </Stack>
  )
}
