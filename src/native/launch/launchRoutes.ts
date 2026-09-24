import { SRL_ROOT } from '../../config/srlNavigation'
import { ROUTES } from '../../constants/routes'
import { NATIVE_UNAVAILABLE_PATH } from '../platform'

/** Ecranele de autentificare: au antetul închis la culoare în care se strânge cortina. */
export const isAuthPath = (pathname: string) =>
  pathname.startsWith(ROUTES.login) || pathname.startsWith(ROUTES.forgotPassword)

/** Ecranele la care ajunge un cont logat; `/app` singur e doar redirectul după rol. */
export const isAppDestination = (pathname: string) =>
  pathname.startsWith('/app/dashboard') ||
  pathname.startsWith('/app/notificari') ||
  pathname.startsWith(NATIVE_UNAVAILABLE_PATH) ||
  pathname.startsWith(SRL_ROOT)
