import { Box, Typography } from '@mui/material'
import { TOKENS } from '../../constants/tokens'

export const SectionHeader = ({
  title,
  subtitle,
  align = 'center',
  maxWidth = 640,
}: {
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  maxWidth?: number
}) => (
  <Box
    sx={{
      textAlign: align,
      mb: { xs: 4, md: 6 },
      maxWidth,
      mx: align === 'center' ? 'auto' : undefined,
    }}
  >
    <Typography
      variant="h2"
      sx={{
        fontSize: { xs: '1.7rem', md: '2.6rem' },
        color: TOKENS.ink,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        sx={{
          mt: 1.5,
          color: TOKENS.textMuted,
          fontSize: { xs: '1rem', md: '1.1rem' },
          maxWidth: 520,
          mx: align === 'center' ? 'auto' : undefined,
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
)
