import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import { Alert, Button, IconButton, Portal, Snackbar, Tooltip } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { ROUTES } from '../../constants/routes'
import { TOKENS } from '../../constants/tokens'
import { carFavorites, useFavoriteCarIds } from '../../services/carFavorites'

const FAVORITE_RED = '#e11d48'

/** Anunțul „salvat pe dispozitiv" apare o singură dată pe sesiune, nu la fiecare inimă. */
let localHintShown = false

interface FavoriteButtonProps {
  carId: string
  carTitle: string
  /** `overlay` — cerc alb peste poza cardului; `outlined` — lângă titlul paginii mașinii. */
  variant?: 'overlay' | 'outlined'
}

/**
 * Inima de favorite. Merge cu sau fără cont: fără cont salvează în browser, iar la logare
 * favoritele se mută în cont (vezi `services/carFavorites`).
 *
 * Clickul nu ajunge la card: cardul întreg e clicabil și ar deschide anunțul.
 */
export function FavoriteButton({ carId, carTitle, variant = 'overlay' }: FavoriteButtonProps) {
  const favoriteIds = useFavoriteCarIds()
  const favorite = favoriteIds.includes(carId)
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string; showSignup?: boolean } | null>(null)

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      const result = await carFavorites.toggle(carId)
      if (result.favorite && result.localOnly && !localHintShown) {
        localHintShown = true
        setNotice({
          tone: 'info',
          text: 'Am salvat mașina pe acest dispozitiv. Fă-ți cont ca s-o ai oriunde — favoritele se mută automat.',
          showSignup: true,
        })
      }
    } catch {
      setNotice({ tone: 'error', text: 'Nu am putut actualiza favoritele. Încearcă din nou.' })
    }
  }

  const label = favorite ? `Scoate ${carTitle} de la favorite` : `Salvează ${carTitle} la favorite`
  const Icon = favorite ? FavoriteRoundedIcon : FavoriteBorderRoundedIcon

  return (
    <>
      <Tooltip title={favorite ? 'Scoate de la favorite' : 'Salvează la favorite'}>
        <IconButton
          onClick={(event) => void toggle(event)}
          aria-label={label}
          aria-pressed={favorite}
          sx={
            variant === 'overlay'
              ? {
                  width: 38,
                  height: 38,
                  backgroundColor: TOKENS.paper,
                  boxShadow: TOKENS.shadow.sm,
                  color: favorite ? FAVORITE_RED : TOKENS.ink,
                  '&:hover': { backgroundColor: TOKENS.paper, transform: 'scale(1.08)' },
                }
              : {
                  width: 44,
                  height: 44,
                  border: `1px solid ${favorite ? FAVORITE_RED : TOKENS.border}`,
                  color: favorite ? FAVORITE_RED : TOKENS.ink,
                  backgroundColor: TOKENS.paper,
                  '&:hover': { borderColor: FAVORITE_RED, color: FAVORITE_RED, backgroundColor: TOKENS.paper },
                }
          }
        >
          <Icon sx={{ fontSize: variant === 'overlay' ? 20 : 22 }} />
        </IconButton>
      </Tooltip>

      {/* Portal: cardul are `transform` la hover și `overflow: hidden`, iar un element fixat
          într-un astfel de părinte s-ar poziționa față de card, nu față de ecran. */}
      <Portal>
      <Snackbar
        open={notice !== null}
        autoHideDuration={notice?.showSignup ? 8000 : 5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        // Snackbarul e randat în card: fără asta, clickurile pe el ar deschide anunțul.
        onClick={(event) => event.stopPropagation()}
      >
        <Alert
          severity={notice?.tone ?? 'info'}
          onClose={() => setNotice(null)}
          action={
            notice?.showSignup ? (
              <Button component={RouterLink} to={ROUTES.register} color="inherit" size="small" sx={{ fontWeight: 700 }}>
                Creează cont
              </Button>
            ) : undefined
          }
          sx={{ alignItems: 'center' }}
        >
          {notice?.text}
        </Alert>
      </Snackbar>
      </Portal>
    </>
  )
}
