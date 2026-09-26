import type { AccountingApi } from './contract'
import { createHttpAccountingApi } from './httpAccountingApi'
import { createMockAccountingApi } from './mock/mockAccountingApi'

/**
 * Implementarea folosită de ecrane, aleasă o singură dată prin `VITE_ACCOUNTING_API`:
 * `mock` (implicit în Partea A) sau `http` (stub până la B9).
 *
 * La B9 implicitul devine `http`, iar `mock` rămâne disponibil doar în dev.
 */
export type AccountingApiMode = 'mock' | 'http'

export const accountingApiMode: AccountingApiMode = import.meta.env.VITE_ACCOUNTING_API === 'http' ? 'http' : 'mock'

export const accountingApi: AccountingApi = accountingApiMode === 'http' ? createHttpAccountingApi() : createMockAccountingApi()
