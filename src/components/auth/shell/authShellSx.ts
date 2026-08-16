import type { SxProps, Theme } from '@mui/material/styles'
import { TOKENS } from '../../../constants/tokens'

/**
 * Ecranul de auth trebuie să încapă într-un singur viewport, fără scroll. Viewportul critic nu e
 * telefonul, ci laptopul de 1366×768: după bara de titlu, tab-uri și bara de adrese rămân ~610px.
 *
 * De aici cele două trepte de spațiere de mai jos. Valorile trăiesc doar aici — dacă ajung
 * duplicate prin componente, prima ajustare de buget le desincronizează.
 */
export const DENSE = '@media (max-height:720px)'

/**
 * Peste pragul ăsta încape și aranjarea completă din mockup (card-urile PFA/Flote din panoul
 * stâng). Sub el cad primele, ca pagina să rămână fără scroll.
 *
 * Pragul e 940, nu 820, fiindcă cele două card-uri și captura de produs se bat pe aceeași
 * înălțime: la 900px ecran, cu card-urile pe loc, poza rămânea la 459×258 — limitată de înălțime,
 * cu ~300px de gol lateral. Fără ele urcă la ~765×430, adică aproape de trei ori aria.
 */
export const ROOMY = '@media (max-height:940px)'

/** Sub pragul ăsta se ascunde trust row-ul și alert-ul trece pe varianta compactă. */
export const SHORT = '@media (max-height:640px)'

/** Sub pragul ăsta dispare și subtitlul formularului. */
export const VERY_SHORT = '@media (max-height:560px)'

export const AUTH_DENSITY = {
  /**
   * Padding vertical al panoului drept. Pe mobil e mai strâns din start: acolo nu există panou
   * de brand care să ceară aer, iar taburile plus linkul „Înapoi la site" consumă deja din buget.
   */
  formPanel: { py: { xs: 3, md: 6 }, [DENSE]: { py: 4 } },
  /** Titlu → subtitlu. */
  titleToSubtitle: { mt: 1, [DENSE]: { mt: 1 } },
  /** Blocul de header → primul câmp. */
  headerToFields: { mb: 4, [DENSE]: { mb: 3 } },
  /** Între câmpuri. */
  betweenFields: { gap: 2.5, [DENSE]: { gap: 2 } },
  /** Ultimul câmp → rândul de meta (ține-mă minte / ai uitat parola). */
  fieldsToMeta: { mt: 2, [DENSE]: { mt: 1.5 } },
  /** Meta row → CTA. */
  metaToCta: { mt: 3, [DENSE]: { mt: 2 } },
  /** CTA → divider. */
  ctaToDivider: { mt: 3, [DENSE]: { mt: 2 } },
  /** Divider → link secundar. */
  dividerToAlt: { mt: 2, [DENSE]: { mt: 1.5 } },
} satisfies Record<string, SxProps<Theme>>

/**
 * 16px pe input e obligatoriu: sub atât, Safari pe iOS face zoom automat la focus și rupe layoutul.
 * Înălțimea de 52px vine din padding, nu din `height` fix, ca label-ul flotant să rămână corect.
 */
export const authInputSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: `${TOKENS.radius.md}px`,
    backgroundColor: TOKENS.paper,
  },
  '& .MuiOutlinedInput-input': {
    py: 1.75,
    fontSize: '1rem',
  },
  '& .MuiInputBase-input::placeholder': {
    color: TOKENS.textSubtle,
    opacity: 1,
  },
}

/** Înălțimea CTA-ului, din bugetul vertical. */
export const AUTH_CTA_HEIGHT = 48

/** Lățimea coloanei formularului și a conținutului ei. */
export const AUTH_FORM_COLUMN = 480
export const AUTH_FORM_CONTENT = 400
