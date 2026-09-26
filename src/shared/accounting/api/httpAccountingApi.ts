import type { AccountingApi, RuleResource } from './contract'
import { AccountingApiError } from './errors'

/**
 * Implementarea HTTP: stub până la B9.
 *
 * Fiecare metodă își declară deja calea, ca B9 să însemne doar înlocuirea `pending` cu apelul
 * `api` din `lib/axios`. Prefixul e `accounting/`, fără `/api`: backendul își mapează toate
 * endpoint-urile direct la rădăcină (de ex. `admin/tax-parameters`).
 */

const PREFIX = 'accounting'

function pending(method: string, path: string): Promise<never> {
  return Promise.reject(
    new AccountingApiError(501, 'NOT_IMPLEMENTED', `${method} /${PREFIX}/${path} nu e implementat încă (B9).`),
  )
}

function ruleResource<T extends { id: string }>(path: string): RuleResource<T> {
  return {
    list: () => pending('GET', `rules/${path}`),
    create: () => pending('POST', `rules/${path}`),
    update: (id) => pending('PUT', `rules/${path}/${id}`),
  }
}

export function createHttpAccountingApi(): AccountingApi {
  return {
    pfas: {
      list: () => pending('GET', 'pfas'),
      getSummary: (pfaId) => pending('GET', `pfas/${pfaId}/summary`),
      getSettings: (pfaId) => pending('GET', `pfas/${pfaId}/settings`),
      updateSettings: (pfaId) => pending('PUT', `pfas/${pfaId}/settings`),
      uploadCashEvidence: (pfaId) => pending('POST', `pfas/${pfaId}/cash/evidence`),
      transitionCash: (pfaId) => pending('POST', `pfas/${pfaId}/cash/transition`),
      deactivate: (pfaId) => pending('POST', `pfas/${pfaId}/deactivate`),
      createHandoverPackage: (pfaId) => pending('POST', `pfas/${pfaId}/handover-package`),
      getAudit: (pfaId) => pending('GET', `pfas/${pfaId}/audit`),
    },
    documents: {
      list: (pfaId) => pending('GET', `pfas/${pfaId}/platform-documents`),
      upload: (pfaId) => pending('POST', `pfas/${pfaId}/platform-documents`),
      get: (id) => pending('GET', `platform-documents/${id}`),
      getFile: (id) => pending('GET', `platform-documents/${id}/file`),
      updateExtraction: (id) => pending('PATCH', `platform-documents/${id}/extraction`),
      confirm: (id) => pending('POST', `platform-documents/${id}/confirm`),
      confirmBulk: () => pending('POST', 'platform-documents/confirm-bulk'),
    },
    months: {
      getOverview: (period) => pending('GET', `periods/${period}/overview`),
      process: (period) => pending('POST', `periods/${period}/process`),
      confirmCleanDocuments: (period) => pending('POST', `periods/${period}/confirm-clean-documents`),
      generate: (period) => pending('POST', `periods/${period}/generate`),
      validate: (period) => pending('POST', `periods/${period}/validate`),
    },
    jobs: {
      get: (jobId) => pending('GET', `jobs/${jobId}`),
    },
    declarations: {
      list: (pfaId) => pending('GET', `pfas/${pfaId}/declarations`),
      get: (id) => pending('GET', `declarations/${id}`),
      getBreakdown: (versionId) => pending('GET', `declaration-versions/${versionId}/breakdown`),
      getXml: (versionId) => pending('GET', `declaration-versions/${versionId}/xml`),
      getPdf: (versionId) => pending('GET', `declaration-versions/${versionId}/pdf`),
      getValidation: (versionId) => pending('GET', `declaration-versions/${versionId}/validation`),
      transition: (versionId) => pending('POST', `declaration-versions/${versionId}/transitions`),
      uploadReceipt: (versionId) => pending('POST', `declaration-versions/${versionId}/receipt`),
      createRectification: (declarationId) => pending('POST', `declarations/${declarationId}/rectification`),
    },
    rules: {
      suppliers: ruleResource('suppliers'),
      vatRates: ruleResource('vat-rates'),
      d100: ruleResource('d100'),
      anafSchemas: ruleResource('anaf-schemas'),
      expenseCategories: ruleResource('expense-categories'),
      getExchangeRate: () => pending('GET', 'rules/exchange-rates'),
    },
    ledger: {
      list: (pfaId) => pending('GET', `pfas/${pfaId}/ledger`),
      update: (id) => pending('PATCH', `ledger/${id}`),
      verify: (id) => pending('POST', `ledger/${id}/verify`),
      createManual: (pfaId) => pending('POST', `pfas/${pfaId}/ledger/manual`),
      uploadExpenseDocument: (pfaId) => pending('POST', `pfas/${pfaId}/expense-documents`),
      uploadZReport: (pfaId) => pending('POST', `pfas/${pfaId}/z-reports`),
    },
    assets: {
      list: (pfaId) => pending('GET', `pfas/${pfaId}/assets`),
      create: (pfaId) => pending('POST', `pfas/${pfaId}/assets`),
      update: (pfaId, id) => pending('PUT', `pfas/${pfaId}/assets/${id}`),
    },
    registers: {
      getRjip: (pfaId) => pending('GET', `pfas/${pfaId}/registers/rjip`),
      exportRjip: (pfaId) => pending('GET', `pfas/${pfaId}/registers/rjip/export`),
      getRef: (pfaId) => pending('GET', `pfas/${pfaId}/registers/ref`),
      exportRef: (pfaId) => pending('GET', `pfas/${pfaId}/registers/ref/export`),
      getInventory: (pfaId) => pending('GET', `pfas/${pfaId}/registers/inventory`),
      exportInventory: (pfaId) => pending('GET', `pfas/${pfaId}/registers/inventory/export`),
    },
    periods: {
      list: (pfaId) => pending('GET', `pfas/${pfaId}/periods`),
      close: (pfaId, period) => pending('POST', `pfas/${pfaId}/periods/${period}/close`),
      createCorrection: (pfaId, period) => pending('POST', `pfas/${pfaId}/periods/${period}/corrections`),
    },
  }
}
