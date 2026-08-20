/**
 * Tipurile paginilor de SRL.
 *
 * Sunt scrise ca forma pe care o va întoarce API-ul în FAZA 2, nu ca forma convenabilă
 * mock-ului (spec §6.2). Când endpoint-urile apar, se schimbă doar sursa din `mocks/`, nu și
 * componentele care consumă tipurile astea.
 *
 * Datele trec prin JSON, deci datele calendaristice sunt string-uri ISO, nu `Date`.
 */

import type { OwnerType } from '../../../config/ownerType'
import type { ScoreSuggestion } from '../../../services/cars.service'

// ──────────────────────────────────────────────────────────────────────────────
// Profil firmă (§3.1)
// ──────────────────────────────────────────────────────────────────────────────

/** Ce anume din datele de contact e public pe mini-site (§3.1, §4.2). */
export interface PublicVisibility {
  phone: boolean
  email: boolean
  whatsapp: boolean
  location: boolean
}

export interface CompanyProfile {
  id: string
  ownerType: OwnerType
  /** Denumirea juridică, cea care intră în contracte. */
  legalName: string
  cui: string
  regCom: string
  legalRepresentative: string
  registeredOffice: string
  phone: string
  email: string
  website: string
  publicDescription: string
  /** `null` cât timp nu s-a încărcat un logo — atunci avatarul cade pe inițiale. */
  logoUrl: string | null
  /** Identitatea din URL-ul mini-site-ului. Stabil: nu se schimbă cu denumirea (§4.2). */
  slug: string
  isVerified: boolean
  visibility: PublicVisibility
}

// ──────────────────────────────────────────────────────────────────────────────
// Conexiuni (§3.4)
// ──────────────────────────────────────────────────────────────────────────────

export type IntegrationProvider = 'Oblio' | 'Bank' | 'Eldrive'

/**
 * Cele patru stări cerute de §3.4. `expiring` nu e derivată în UI din `expiresAt`: pragul e o
 * regulă de business care în FAZA 2 stă pe server, iar două praguri diferite (unul în FE, unul
 * în BE) ar produce carduri care se contrazic.
 */
export type IntegrationStatus = 'disconnected' | 'connected' | 'expiring' | 'error'

export interface Integration {
  provider: IntegrationProvider
  status: IntegrationStatus
  connectedAtUtc: string | null
  /** Consimțământul bancar expiră la 90 de zile; celelalte integrări nu expiră. */
  expiresAtUtc: string | null
  lastSyncAtUtc: string | null
  /** Mesajul afișat pe cardul în eroare. Vine de la server, nu se compune în UI. */
  errorMessage: string | null
  /**
   * Perechile de afișat pe card, în ordinea în care trebuie citite. Fiecare provider are alte
   * detalii (CIF și serie la Oblio, IBAN la bancă, card RFID la eldrive), iar un tip cu toate
   * câmpurile opționale ar fi însemnat un card plin de `&&`.
   */
  details: { label: string; value: string }[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Fiscal (§3.3.2)
// ──────────────────────────────────────────────────────────────────────────────

export type TaxRegime = 'Micro' | 'Profit'

export type DeclarationCode = 'D100' | 'D101' | 'D300' | 'D394' | 'D112'

export interface FiscalDeclaration {
  code: DeclarationCode
  label: string
  /** Termenul legal de depunere, ISO. */
  dueDateUtc: string
  period: string
}

export interface SrlFiscalOverview {
  regime: TaxRegime
  vatPayer: boolean
  /** `null` când firma nu e plătitoare de TVA. */
  vatPeriodicity: 'Lunar' | 'Trimestrial' | null
  declarations: FiscalDeclaration[]
  /** Impozitul estimat pe trimestrul curent, în bani. */
  estimatedQuarterlyTaxBani: number
  quarterLabel: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Scor de anunț (§5.2)
// ──────────────────────────────────────────────────────────────────────────────

export interface ListingScore {
  carId: string
  /** 0–100. Calculat pe server și stocat pe anunț — UI-ul doar îl afișează. */
  score: number
  suggestions: ScoreSuggestion[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Setări operaționale (§3.1 — identitatea trăiește în Profil, aici rămân preferințele)
// ──────────────────────────────────────────────────────────────────────────────

export interface SrlSettings {
  defaultWeeklyRentBani: number
  defaultDepositBani: number
  minimumPeriod: string
  kmLimit: 'Fără limită' | 'Cu limită'
  extraKmCostBani: number
  fuelRule: string
}
