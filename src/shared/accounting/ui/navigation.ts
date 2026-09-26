import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { AccountingRole, Period } from '../api/types'

/**
 * Navigarea modulului, pe convenția dashboard-urilor existente: totul stă în query string
 * (`/admin?tab=…`, `/contabil?tab=…`), nu în segmente de cale. Ruta din spec
 * `.../pfa/{id}/accounting` devine `?tab=<pfa>&pfa={id}&sectiune=…`.
 *
 * Fiecare rol își numește tab-urile altfel în meniu; componentele primesc numele prin context și
 * nu știu în ce dashboard sunt montate.
 */

export interface AccountingTabs {
  pfa: string
  declarations: string
  rules: string
}

export interface AccountingConfig {
  role: AccountingRole
  tabs: AccountingTabs
}

export const AccountingConfigContext = createContext<AccountingConfig | null>(null)

export const DOSSIER_SECTIONS = ['declaratii', 'documente', 'tranzactii', 'registre', 'setari', 'istoric'] as const
export type DossierSection = (typeof DOSSIER_SECTIONS)[number]

export const DOSSIER_SECTION_LABEL: Record<DossierSection, string> = {
  declaratii: 'Declarații',
  documente: 'Documente platformă',
  tranzactii: 'Tranzacții',
  registre: 'Registre',
  setari: 'Setări contabilitate',
  istoric: 'Istoric',
}

/** Precompletarea formularului de furnizor, din verificarea „furnizor necunoscut” (F2). */
export interface SupplierPrefill {
  supplierName?: string
  country?: string
  vatId?: string
}

/** Parametrii din query string care aparțin modulului. */
const OWNED_PARAMS = ['tab', 'pfa', 'sectiune', 'luna', 'document', 'lista', 'exceptii', 'furnizor_tva', 'furnizor_tara', 'furnizor_nume']

export function useAccountingConfig(): AccountingConfig {
  const config = useContext(AccountingConfigContext)
  if (!config) throw new Error('useAccountingConfig în afara <AccountingArea>.')
  return config
}

export function useAccountingNav() {
  const { tabs, role } = useAccountingConfig()
  const [params, setParams] = useSearchParams()

  /** Înlocuiește parametrii modulului; ce aparține dashboard-ului gazdă rămâne neatins. */
  const go = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams(params)
    OWNED_PARAMS.forEach((key) => search.delete(key))
    Object.entries(next).forEach(([key, value]) => {
      if (value) search.set(key, value)
    })
    setParams(search)
  }

  const section = params.get('sectiune')
  return {
    role,
    pfaId: params.get('pfa'),
    section: (DOSSIER_SECTIONS as readonly string[]).includes(section ?? '') ? (section as DossierSection) : 'declaratii',
    period: params.get('luna'),
    documentId: params.get('document'),
    listTab: params.get('lista') === 'inactive' ? ('inactive' as const) : ('active' as const),
    onlyExceptions: params.get('exceptii') === '1',
    supplierPrefill: params.get('furnizor_tva')
      ? { vatId: params.get('furnizor_tva') ?? undefined, country: params.get('furnizor_tara') ?? undefined, supplierName: params.get('furnizor_nume') ?? undefined }
      : null,

    openPfaList: (listTab: 'active' | 'inactive' = 'active') =>
      go({ tab: tabs.pfa, lista: listTab === 'inactive' ? 'inactive' : undefined }),
    openPfa: (pfaId: string, section: DossierSection = 'declaratii', extra: { luna?: Period; document?: string } = {}) =>
      go({ tab: tabs.pfa, pfa: pfaId, sectiune: section, ...extra }),
    /** Păstrează restul parametrilor (de ex. deschide un document peste tabul curent). */
    setParam: (key: string, value: string | null) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      setParams(next)
    },
    openMonth: (period?: Period, onlyExceptions = false) =>
      go({ tab: tabs.declarations, luna: period, exceptii: onlyExceptions ? '1' : undefined }),
    openRules: (prefill?: SupplierPrefill) =>
      go({
        tab: tabs.rules,
        furnizor_tva: prefill?.vatId,
        furnizor_tara: prefill?.country,
        furnizor_nume: prefill?.supplierName,
      }),
  }
}
