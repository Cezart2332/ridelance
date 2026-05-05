import { Stack, Typography, Tooltip } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { TOKENS } from '../../constants/tokens'

export function TaxRow({
  label,
  value,
  bold,
  highlight,
  info,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
  info?: string
}) {
  return (
    <Stack
      component="div"
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Stack component="div" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            color: bold ? TOKENS.ink : TOKENS.textMuted,
            fontWeight: bold ? 650 : 400,
          }}
        >
          {label}
        </Typography>
        {info && (
          <Tooltip title={info} arrow placement="top">
            <InfoOutlinedIcon sx={{ fontSize: 16, color: TOKENS.textSubtle, cursor: 'help' }} />
          </Tooltip>
        )}
      </Stack>
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
