import { Avatar } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

import { uploadUrl } from '../../lib/api'
import { AVATAR_PALETTE, DASHBOARD_TOKENS } from '../dashboard/dashboardTheme'

/**
 * Avatarul unui proprietar — firmă sau PFA — cu logo dacă există și inițiale dacă nu.
 *
 * Există o singură dată fiindcă spec-ul îl cere în patru locuri deodată: sidebar-ul (§2.1),
 * cele trei previzualizări din Profil (§3.1) și cardul de mașină din marketplace (§4.1). Regula
 * de fallback trebuie să dea același rezultat în toate — un proprietar care apare cu alt cerc
 * colorat pe marketplace decât în dashboard arată ca doi proprietari diferiți.
 */

/** Maximum două litere, din primele două cuvinte care chiar sunt cuvinte. */
function initialsFrom(name: string): string {
  const words = name
    .split(/[\s.-]+/)
    .map((word) => word.trim())
    .filter((word) => /\p{L}/u.test(word))

  if (words.length === 0) return '?'

  return words
    .slice(0, 2)
    .map((word) => [...word][0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Culoarea de fundal, derivată determinist din nume.
 *
 * Suma codurilor de caracter, nu `charCodeAt(0)`: „TUKI GO" și „TRANS GO" ar fi primit aceeași
 * culoare, iar în sidebar-ul cuiva care jonglează cu două conturi asta e exact confuzia de evitat.
 */
function avatarColorFor(name: string): string {
  const sum = [...name].reduce((acc, char) => acc + char.codePointAt(0)!, 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}

export interface OwnerAvatarProps {
  /** Denumirea proprietarului. Sursa inițialelor și a culorii de fallback. */
  name: string
  /**
   * Logo-ul încărcat, ca și cale relativă întoarsă de API. Lipsa lui nu e o eroare — e cazul
   * obișnuit. Originea o adaugă componenta: pusă direct în `src`, calea s-ar rezolva față de
   * pagina curentă și fișierul ar fi cerut de la frontend, unde nu există.
   */
  logoUrl?: string | null
  /** Diametrul în px. 28 pe cardul de mașină, 32 pe pagina de detaliu (spec §4.1). */
  size?: number
  sx?: SxProps<Theme>
}

export function OwnerAvatar({ name, logoUrl, size = 34, sx }: OwnerAvatarProps) {
  const initials = initialsFrom(name)

  return (
    <Avatar
      src={uploadUrl(logoUrl) || undefined}
      // Numele e mereu scris lângă avatar, deci alt-ul l-ar dubla pentru un screen reader.
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        bgcolor: avatarColorFor(name),
        color: DASHBOARD_TOKENS.paper,
        fontWeight: 800,
        // Inițialele scalează cu cercul; sub ~0.4 din diametru arată pierdute în mijloc.
        fontSize: `${Math.round(size * 0.4)}px`,
        ...sx,
      }}
    >
      {initials}
    </Avatar>
  )
}
