import type { AccountingApi } from './contract'
import { createHttpAccountingApi } from './httpAccountingApi'
import { createMockAccountingApi } from './mock/mockAccountingApi'

/**
 * Implementarea folosită de ecrane, aleasă o singură dată. Implicit `http` (API-ul real, B9);
 * `mock` (datele din memorie ale Părții A) doar în dev, cu `VITE_ACCOUNTING_API=mock`.
 */
export type AccountingApiMode = 'mock' | 'http'

export const accountingApiMode: AccountingApiMode =
  import.meta.env.DEV && import.meta.env.VITE_ACCOUNTING_API === 'mock' ? 'mock' : 'http'

export const accountingApi: AccountingApi = accountingApiMode === 'http' ? createHttpAccountingApi() : createMockAccountingApi()
