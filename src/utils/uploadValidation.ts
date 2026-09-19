/**
 * Limitele hard ale uploadului — cele pe care le impune și backendul.
 *
 * Calitatea pozei (rezoluție, lumină, claritate) NU se mai judecă aici: OCR-ul citește
 * documentul și spune el dacă nu se poate, iar adminul verifică la final. O euristică din
 * browser respingea și poze perfect lizibile.
 */

/** Aceeași limită ca pe server (UploadDocumentCommandHandler.MaxFileSize). */
export const MAX_UPLOAD_MB = 25
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
