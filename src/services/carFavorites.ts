import { useSyncExternalStore } from 'react'

import { api } from '../lib/axios'
import { store } from '../store/store'

/**
 * Mașinile salvate la favorite.
 *
 * Două surse, un singur API pentru componente:
 * - **fără cont** — în `localStorage`, pe dispozitivul curent;
 * - **cu cont** — pe server, deci pe orice dispozitiv.
 *
 * La începutul unei sesiuni (logare, cont nou, sau reîmprospătarea sesiunii la încărcarea paginii)
 * favoritele din browser se mută în cont și se șterg local. Mutarea e idempotentă pe server, deci
 * nu contează dacă se întâmplă de două ori.
 *
 * Starea trăiește în modul, nu într-un provider: cardul de mașină apare pe site, pe mini-site-ul
 * firmelor și în dashboard, iar un provider ar fi trebuit montat în fiecare.
 */

const STORAGE_KEY = 'rl_favorite_cars'
/** Destul pentru orice om; limita ține `localStorage`-ul mic și cererea de mutare sub pragul serverului. */
const MAX_LOCAL = 200

let ids: string[] = readLocal()
/** Sesiunea pentru care am încărcat favoritele de pe server. `null` = fără cont. */
let loadedForUser: string | null = null
const listeners = new Set<() => void>()

function readLocal(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    // Browser cu datele site-ului blocate sau conținut corupt: pornim gol, fără să stricăm pagina.
    return []
  }
}

function writeLocal(next: string[]) {
  try {
    if (next.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_LOCAL)))
  } catch {
    // Fără stocare disponibilă favoritele țin doar cât pagina e deschisă.
  }
}

function set(next: string[]) {
  ids = next
  listeners.forEach((listener) => listener())
}

function hasSession() {
  return Boolean(store.getState().auth.accessToken)
}

/**
 * Sincronizarea cu contul, la fiecare schimbare de utilizator.
 *
 * Pe durata unei impersonări nu mutăm nimic: favoritele din browserul adminului nu sunt ale
 * clientului pe care îl vizualizează.
 */
async function syncWithSession() {
  const { accessToken, userId, impersonation } = store.getState().auth

  if (!accessToken || !userId) {
    if (loadedForUser !== null) {
      // Delogare: pe dispozitiv rămâne doar ce se salvase local.
      loadedForUser = null
      set(readLocal())
    }
    return
  }

  if (loadedForUser === userId) return
  loadedForUser = userId

  try {
    const local = impersonation ? [] : readLocal()
    const { data } =
      local.length > 0
        ? await api.post<string[]>('/cars/favorites/merge', { carIds: local })
        : await api.get<string[]>('/cars/favorites')

    if (local.length > 0) writeLocal([])
    if (loadedForUser === userId) set(data)
  } catch {
    // Serverul n-a răspuns: lăsăm favoritele locale pe loc, ca să se mute la următoarea încercare.
    loadedForUser = null
  }
}

let subscribedToAuth = false
function ensureAuthSubscription() {
  if (subscribedToAuth) return
  subscribedToAuth = true

  let lastUser = store.getState().auth.userId
  store.subscribe(() => {
    const user = store.getState().auth.userId
    if (user !== lastUser) {
      lastUser = user
      void syncWithSession()
    }
  })
  void syncWithSession()
}

function subscribe(listener: () => void) {
  ensureAuthSubscription()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => ids

export const carFavorites = {
  isFavorite: (carId: string) => ids.includes(carId),

  /**
   * Adaugă sau scoate o mașină. Schimbarea se vede imediat; dacă serverul refuză, revine.
   * Întoarce noua stare și dacă salvarea s-a făcut doar local.
   */
  async toggle(carId: string): Promise<{ favorite: boolean; localOnly: boolean }> {
    const wasFavorite = ids.includes(carId)
    const next = wasFavorite ? ids.filter((id) => id !== carId) : [carId, ...ids]
    set(next)

    if (!hasSession()) {
      writeLocal(next)
      return { favorite: !wasFavorite, localOnly: true }
    }

    try {
      if (wasFavorite) await api.delete(`/cars/${carId}/favorite`)
      else await api.put(`/cars/${carId}/favorite`)
    } catch (error) {
      set(wasFavorite ? [carId, ...ids.filter((id) => id !== carId)] : ids.filter((id) => id !== carId))
      throw error
    }

    return { favorite: !wasFavorite, localOnly: false }
  },
}

/** Id-urile mașinilor de la favorite, reactive. */
export function useFavoriteCarIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
