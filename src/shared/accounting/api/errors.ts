/**
 * Eroarea comună a celor două implementări. Mock-ul o aruncă cu aceleași coduri HTTP pe care le
 * va da backendul (404, 400, 409), ca ecranele să trateze erorile o singură dată.
 */
export class AccountingApiError extends Error {
  readonly status: number
  /** Cod stabil pentru ramificări în UI, de ex. `INVALID_TRANSITION`. */
  readonly code: string
  /** Date suplimentare, de ex. `existingDocumentId` la un upload duplicat. */
  readonly details: Record<string, unknown> | null

  constructor(status: number, code: string, message: string, details: Record<string, unknown> | null = null) {
    super(message)
    this.name = 'AccountingApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const notFound = (what: string) => new AccountingApiError(404, 'NOT_FOUND', `${what} nu există.`)

export const badRequest = (code: string, message: string) => new AccountingApiError(400, code, message)

export const conflict = (code: string, message: string, details?: Record<string, unknown>) =>
  new AccountingApiError(409, code, message, details ?? null)

export function isAccountingApiError(error: unknown): error is AccountingApiError {
  return error instanceof AccountingApiError
}
