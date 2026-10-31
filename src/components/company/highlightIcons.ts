import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import BuildRoundedIcon from '@mui/icons-material/BuildRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import MapRoundedIcon from '@mui/icons-material/MapRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import WalletRoundedIcon from '@mui/icons-material/WalletRounded'

import type { HighlightIconKey } from '../../services/company.service'

/**
 * Iconițele pentru avantajele de pe mini-site.
 *
 * Lista e închisă și e dublată pe server, în `CompanyPageIcons.Allowed` — cele două trebuie
 * ținute sincronizate. O cheie adăugată doar aici nu poate fi salvată niciodată; una adăugată
 * doar pe server ajunge pe pagină ca bifă.
 */
export const HIGHLIGHT_ICONS: Record<HighlightIconKey, typeof CheckCircleRoundedIcon> = {
  check: CheckCircleRoundedIcon,
  shield: VerifiedUserRoundedIcon,
  clock: ScheduleRoundedIcon,
  wallet: WalletRoundedIcon,
  car: DirectionsCarFilledRoundedIcon,
  phone: PhoneRoundedIcon,
  star: StarRoundedIcon,
  wrench: BuildRoundedIcon,
  map: MapRoundedIcon,
  bolt: BoltRoundedIcon,
}

/** Cheile în ordinea în care se arată în editor. */
export const HIGHLIGHT_ICON_KEYS = Object.keys(HIGHLIGHT_ICONS) as HighlightIconKey[]

export function highlightIcon(key: string): typeof CheckCircleRoundedIcon {
  return HIGHLIGHT_ICONS[key as HighlightIconKey] ?? CheckCircleRoundedIcon
}
