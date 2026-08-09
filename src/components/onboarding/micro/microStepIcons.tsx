import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import type { SvgIconComponent } from '@mui/icons-material'

import type { MicroStepIcon } from '../microStepTypes'

/** Config-ul referă iconițele prin cheie, ca să nu importe MUI în fișiere de date. */
export const ICON_MAP: Record<MicroStepIcon, SvgIconComponent> = {
  user: PersonRoundedIcon,
  idCard: BadgeRoundedIcon,
  car: DirectionsCarFilledRoundedIcon,
  shield: VerifiedUserRoundedIcon,
  checkCircle: CheckCircleRoundedIcon,
  folder: FolderRoundedIcon,
}
