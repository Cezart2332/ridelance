/**
 * Setările care diferă între medii: adresa API-ului, cheia publică Stripe, tokenul Mapbox.
 *
 * Vin din `/config.js`, pe care containerul îl scrie la pornire din variabilele lui de mediu
 * (`docker/40-runtime-config.sh`). Așa aceeași imagine rulează și pe producție, și pe site-ul de
 * test: nu mai e nevoie de un build separat pentru fiecare adresă de API.
 *
 * Valorile coapte la build (`VITE_*`) rămân plasa de siguranță: dezvoltarea locală, aplicația
 * mobilă și un container pornit fără variabile merg ca până acum.
 */
interface RuntimeConfig {
  apiBaseUrl?: string
  stripePublicKey?: string
  mapboxToken?: string
}

const runtime: RuntimeConfig =
  (typeof window !== 'undefined' ? (window as { __RL_CONFIG__?: RuntimeConfig }).__RL_CONFIG__ : undefined) ?? {}

const pick = (fromContainer: string | undefined, fromBuild: string | undefined, fallback: string) =>
  fromContainer?.trim() || fromBuild || fallback

export const API_BASE_URL = pick(runtime.apiBaseUrl, import.meta.env.VITE_API_BASE_URL, 'http://localhost:5000').replace(/\/+$/, '')

export const STRIPE_PUBLIC_KEY = pick(runtime.stripePublicKey, import.meta.env.VITE_PUBLIC_STRIPE, '')

export const MAPBOX_PUBLIC_TOKEN = pick(runtime.mapboxToken, import.meta.env.VITE_MAPBOX_TOKEN, '')
