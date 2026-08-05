/**
 * Limitele hard ale uploadului — cele pe care le impune și backendul.
 *
 * Calitatea pozei (rezoluție, lumină, claritate) NU se mai judecă aici: OCR-ul citește
 * documentul și spune el dacă nu se poate, iar adminul verifică la final. O euristică din
 * browser respingea și poze perfect lizibile.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
