import { Box } from '@mui/material'
import checkSvg from '../../assets/SVG/2- Regular/check-circle.svg'

export const GradientCheckIcon = ({ sx }: { sx?: object }) => (
  <Box
    component="img"
    src={checkSvg}
    sx={{
      width: 22,
      height: 22,
      flexShrink: 0,
      mt: 0.2,
      filter:
        'invert(28%) sepia(87%) saturate(2222%) hue-rotate(210deg) brightness(98%) contrast(92%)',
      ...sx,
    }}
  />
)
