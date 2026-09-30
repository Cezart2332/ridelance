import axios, { type AxiosRequestConfig } from 'axios'
import { api } from '../../../lib/axios'
import type { AccountingApi, RuleResource } from './contract'
import { AccountingApiError } from './errors'
import type { Asset, CashPreference, ExchangeRate, ValidationResult, VatRegistration } from './types'

/**
 * Implementarea HTTP a contractului (B9), peste instanța `api` din `lib/axios` (token, refresh).
 * Prefixul e `accounting/`, fără `/api`: backendul își mapează endpoint-urile direct la rădăcină.
 */

const PREFIX = 'accounting'

/** `Accounting.InvalidTransition` → `INVALID_TRANSITION`, codul pe care îl folosește și mock-ul. */
function contractCode(title: unknown): string {
  if (typeof title !== 'string' || !title) return 'UNKNOWN'
  const name = title.includes('.') ? title.slice(title.lastIndexOf('.') + 1) : title
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
}

/** ProblemDetails (`title` = codul, `detail` = mesajul) → aceeași eroare ca în mock. */
async function toApiError(error: unknown): Promise<AccountingApiError> {
  if (!axios.isAxiosError(error)) {
    return new AccountingApiError(0, 'NETWORK', error instanceof Error ? error.message : 'Eroare necunoscută.')
  }
  if (!error.response) {
    return new AccountingApiError(0, 'NETWORK', 'Serverul nu răspunde. Verifică conexiunea și încearcă din nou.')
  }

  let body: unknown = error.response.data
  if (body instanceof Blob) {
    // La descărcări răspunsul vine ca Blob și în caz de eroare.
    try {
      body = JSON.parse(await body.text())
    } catch {
      body = null
    }
  }

  const problem = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const { title, detail, status, type, errors, traceId, ...details } = problem
  void status
  void type
  void traceId
  const message =
    typeof detail === 'string' && detail
      ? detail
      : errors && typeof errors === 'object'
        ? Object.values(errors as Record<string, string[]>).flat().join(' ')
        : `Cererea a eșuat (${error.response.status}).`
  return new AccountingApiError(error.response.status, contractCode(title), message, Object.keys(details).length ? details : null)
}

async function call<T>(config: AxiosRequestConfig, prefix = PREFIX): Promise<T> {
  try {
    const response = await api.request<T>({ ...config, url: `${prefix}/${config.url}` })
    return response.data
  } catch (error) {
    throw await toApiError(error)
  }
}

const get = <T>(url: string, params?: object) => call<T>({ method: 'GET', url, params: clean(params) })
const post = <T>(url: string, data?: unknown) => call<T>({ method: 'POST', url, data })
const put = <T>(url: string, data?: unknown) => call<T>({ method: 'PUT', url, data })
const patch = <T>(url: string, data?: unknown) => call<T>({ method: 'PATCH', url, data })
const remove = (url: string) => call<void>({ method: 'DELETE', url })
const blob = (url: string, params?: object) => call<Blob>({ method: 'GET', url, params: clean(params), responseType: 'blob' })

/** Un răspuns „fără valoare” (200 fără corp) devine `null`. */
const orNull = <T>(value: T | '' | null | undefined): T | null => (value === '' || value === undefined ? null : value)

/** Parametrii fără valori goale: backendul nu primește `?status=`. */
function clean(params?: object): Record<string, string | number> | undefined {
  if (!params) return undefined
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number>
}

function form(fields: Record<string, string | Blob | undefined>): FormData {
  const data = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) data.append(key, value)
  })
  return data
}

function ruleResource<T extends { id: string }>(path: string): RuleResource<T> {
  return {
    list: () => get(`rules/${path}`),
    create: (input) => post(`rules/${path}`, input),
    update: (id, input) => put(`rules/${path}/${id}`, input),
  }
}

export function createHttpAccountingApi(): AccountingApi {
  return {
    pfas: {
      list: (query) => get('pfas', query),
      getSummary: (pfaId) => get(`pfas/${pfaId}/summary`),
      getSettings: (pfaId) => get(`pfas/${pfaId}/settings`),
      updateSettings: (pfaId, change) => put(`pfas/${pfaId}/settings`, change),
      uploadCashEvidence: (pfaId, file) => post(`pfas/${pfaId}/cash/evidence`, form({ file })),
      transitionCash: (pfaId, request) => post(`pfas/${pfaId}/cash/transition`, request),
      deactivate: (pfaId, request) => post(`pfas/${pfaId}/deactivate`, request),
      createHandoverPackage: (pfaId) => post(`pfas/${pfaId}/handover-package`),
      getAudit: (pfaId, query) => get(`pfas/${pfaId}/audit`, query),
    },
    onboarding: {
      getCashPreference: async () => orNull(await get<CashPreference | ''>('me/cash-preference')),
      setCashPreference: (request) => put('me/cash-preference', request),
    },
    documents: {
      list: (pfaId, period) => get(`pfas/${pfaId}/platform-documents`, { period }),
      upload: (pfaId, request) => post(`pfas/${pfaId}/platform-documents`, form({ file: request.file, period: request.period })),
      get: (id) => get(`platform-documents/${id}`),
      getFile: (id) => blob(`platform-documents/${id}/file`),
      updateExtraction: (id, request) => patch(`platform-documents/${id}/extraction`, request),
      confirm: (id) => post(`platform-documents/${id}/confirm`),
      confirmBulk: (request) => post('platform-documents/confirm-bulk', request),
      remove: (id) => remove(`platform-documents/${id}`),
    },
    clients: {
      list: (period) => get('clients', { period }),
    },
    anaf: {
      connection: () => call({ method: 'GET', url: 'connection' }, 'anaf'),
      start: async (returnPath) => (await call<{ url: string }>({ method: 'POST', url: 'oauth/start', data: { returnPath } }, 'anaf')).url,
      disconnect: () => call({ method: 'DELETE', url: 'connection' }, 'anaf'),
      forPfa: (pfaId) => get(`pfas/${pfaId}/efactura`),
      connectPfa: (pfaId) => post(`pfas/${pfaId}/efactura/connect`),
      sync: (pfaId) => post(`pfas/${pfaId}/efactura/sync`),
      disablePfa: (pfaId) => remove(`pfas/${pfaId}/efactura`),
      getFile: (messageId, kind) => blob(`efactura/${messageId}/${kind}`),
    },
    spv: {
      forPfa: (pfaId) => get(`pfas/${pfaId}/spv`),
      queueRequest: (pfaId, type, parameters) => post(`pfas/${pfaId}/spv/requests`, { type, parameters }),
      markRead: (messageId) => post(`spv/messages/${messageId}/read`),
      getFile: (messageId) => blob(`spv/messages/${messageId}/file`),
      overview: () => call({ method: 'GET', url: 'spv' }, 'anaf'),
      createKey: (name) => call({ method: 'POST', url: 'spv/keys', data: { name } }, 'anaf'),
      revokeKey: (keyId) => call({ method: 'DELETE', url: `spv/keys/${keyId}` }, 'anaf'),
    },
    vatRegistrations: {
      list: () => get('vat-registrations'),
      forPfa: async (pfaId) => orNull(await get<VatRegistration | ''>(`pfas/${pfaId}/vat-registration`)),
      generate: (pfaId) => post(`pfas/${pfaId}/vat-registration`),
      validate: (id) => post(`vat-registrations/${id}/validate`),
      transition: (id, to, note) => post(`vat-registrations/${id}/transitions`, { to, note }),
      registerCode: (id, request) =>
        post(`vat-registrations/${id}/vat-code`, form({ vatCode: request.vatCode, validFrom: request.validFrom, file: request.file })),
      getFile: (id, kind) => blob(`vat-registrations/${id}/${kind}`),
    },
    months: {
      getOverview: (period) => get(`periods/${period}/overview`),
      process: (period, pfaId) => post(`${pfaId ? `pfas/${pfaId}/` : ''}periods/${period}/process`),
      confirmCleanDocuments: (period) => post(`periods/${period}/confirm-clean-documents`),
      generate: (period, pfaId) => post(`${pfaId ? `pfas/${pfaId}/` : ''}periods/${period}/generate`),
      validate: (period, pfaId) => post(`${pfaId ? `pfas/${pfaId}/` : ''}periods/${period}/validate`),
    },
    jobs: {
      get: (jobId) => get(`jobs/${jobId}`),
      getFile: (jobId) => blob(`jobs/${jobId}/file`),
    },
    declarations: {
      list: (pfaId, period) => get(`pfas/${pfaId}/declarations`, { period }),
      get: (id) => get(`declarations/${id}`),
      getBreakdown: (versionId) => get(`declaration-versions/${versionId}/breakdown`),
      getXml: (versionId) => call<string>({ method: 'GET', url: `declaration-versions/${versionId}/xml`, responseType: 'text' }),
      getPdf: (versionId) => blob(`declaration-versions/${versionId}/pdf`),
      getValidation: async (versionId) => orNull(await get<ValidationResult | ''>(`declaration-versions/${versionId}/validation`)),
      transition: (versionId, request) => post(`declaration-versions/${versionId}/transitions`, request),
      uploadReceipt: (versionId, request) =>
        post(`declaration-versions/${versionId}/receipt`, form({ file: request.file, receiptNumber: request.receiptNumber || undefined })),
      createRectification: (declarationId, request) => post(`declarations/${declarationId}/rectification`, request),
    },
    rules: {
      suppliers: { ...ruleResource('suppliers'), remove: (id) => remove(`rules/suppliers/${id}`) },
      vatRates: ruleResource('vat-rates'),
      d100: ruleResource('d100'),
      anafSchemas: ruleResource('anaf-schemas'),
      expenseCategories: ruleResource('expense-categories'),
      getExchangeRate: async (query) => orNull(await get<ExchangeRate | ''>('rules/exchange-rates', query)),
    },
    ledger: {
      list: (pfaId, query) => get(`pfas/${pfaId}/ledger`, query),
      update: (id, request) => patch(`ledger/${id}`, request),
      verify: (id) => post(`ledger/${id}/verify`),
      createManual: (pfaId, request) => post(`pfas/${pfaId}/ledger/manual`, request),
      uploadExpenseDocument: (pfaId, file) => post(`pfas/${pfaId}/expense-documents`, form({ file })),
      confirmExpenseDocument: (pfaId, id, request) => post(`pfas/${pfaId}/expense-documents/${id}/confirm`, request),
      matchProposals: (pfaId) => get(`pfas/${pfaId}/match-proposals`),
      acceptMatch: (id) => post(`match-proposals/${id}/accept`),
      rejectMatch: async (id) => {
        await post(`match-proposals/${id}/reject`)
      },
      uploadZReport: (pfaId, file) => post(`pfas/${pfaId}/z-reports`, form({ file })),
    },
    assets: {
      list: (pfaId, asOf) => get(`pfas/${pfaId}/assets`, { asOf }),
      get: (pfaId, id) => get(`pfas/${pfaId}/assets/${id}`),
      candidates: (pfaId) => get(`pfas/${pfaId}/fixed-asset-candidates`),
      decide: async (pfaId, ledgerEntryId, decision, name, reason) =>
        (await post<Asset | ''>(`pfas/${pfaId}/ledger/${ledgerEntryId}/fixed-asset-decision`, { decision, name, reason })) || null,
      create: (pfaId, request) => post(`pfas/${pfaId}/assets`, request),
      classify: (pfaId, id, request) => put(`pfas/${pfaId}/assets/${id}`, request),
      dispose: (pfaId, id, date, reason) => post(`pfas/${pfaId}/assets/${id}/dispose`, { date, reason }),
      exportSheet: (pfaId, id, format) => blob(`pfas/${pfaId}/assets/${id}/sheet`, { format }),
      exportList: (pfaId, asOf, format) => blob(`pfas/${pfaId}/assets/register`, { asOf, format }),
    },
    registers: {
      status: (pfaId, year) => get(`pfas/${pfaId}/registers/status`, { year }),
      getRjip: (pfaId, range, regenerate) => get(`pfas/${pfaId}/registers/rjip`, { ...range, regenerate: regenerate || undefined }),
      exportRjip: (pfaId, range, format) => blob(`pfas/${pfaId}/registers/rjip/export`, { ...range, format }),
      getRef: (pfaId, year) => get(`pfas/${pfaId}/registers/ref`, { year }),
      exportRef: (pfaId, year, format, asOf) => blob(`pfas/${pfaId}/registers/ref/export`, { year, format, asOf }),
      exportInventory: (pfaId, year, format) => blob(`pfas/${pfaId}/registers/inventory/export`, { year, format }),
    },
    inventory: {
      list: (pfaId) => get(`pfas/${pfaId}/inventory-counts`),
      start: (pfaId, date, reason) => post(`pfas/${pfaId}/inventory-counts`, { date, reason }),
      updateItem: (pfaId, countId, itemId, request) => patch(`pfas/${pfaId}/inventory-counts/${countId}/items/${itemId}`, request),
      addItem: (pfaId, countId, request) => post(`pfas/${pfaId}/inventory-counts/${countId}/items`, request),
      finalize: (pfaId, countId) => post(`pfas/${pfaId}/inventory-counts/${countId}/finalize`),
    },
    years: {
      get: (pfaId, year) => get(`pfas/${pfaId}/years/${year}`),
      close: (pfaId, year) => post(`pfas/${pfaId}/years/${year}/close`),
      reopen: (pfaId, year, reason) => post(`pfas/${pfaId}/years/${year}/reopen`, { reason }),
      package: (pfaId, year) => blob(`pfas/${pfaId}/years/${year}/package`),
    },
    periods: {
      list: (pfaId) => get(`pfas/${pfaId}/periods`),
      close: (pfaId, period) => post(`pfas/${pfaId}/periods/${period}/close`),
      reconciliation: (pfaId, period) => get(`pfas/${pfaId}/periods/${period}/reconciliation`),
      reopen: (pfaId, period, reason) => post(`pfas/${pfaId}/periods/${period}/reopen`, { reason }),
      createCorrection: (pfaId, period, request) => post(`pfas/${pfaId}/periods/${period}/corrections`, request),
      explain: async (pfaId, period, control, note) => {
        await post(`pfas/${pfaId}/periods/${period}/explanations`, { control, note })
      },
    },
  }
}
