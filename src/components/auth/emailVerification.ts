/**
 * Starea confirmării adresei de email.
 *
 * **Confirmarea nu e impusă.** Codul se trimite și poate fi introdus, dar contul funcționează
 * complet fără el: autentificarea nu îl verifică, pagina de confirmare lasă utilizatorul mai
 * departe, iar un cod greșit nu oprește fluxul.
 *
 * Comutatorul e pe server, per mediu (`REQUIRE_EMAIL_VERIFICATION`, citit prin
 * `verificationPolicy.ts`). Pornit:
 *   - un cod greșit oprește pasul, în loc să lase utilizatorul să treacă;
 *   - linkul „Continuă" dispare.
 *
 * Regula se aplică la pasul de după înregistrare. Ca să fie impusă și conturilor existente, mai
 * trebuie partea de server —
 * `LoginUserCommandHandler` să refuze un cont neconfirmat — plus o decizie despre conturile
 * existente, care sunt toate neconfirmate. Vezi `Domain/Users/EmailVerification.cs`.
 */
export const EMAIL_VERIFICATION = {
  codeLength: 6,
  resendCooldownSeconds: 60,
} as const

/**
 * Același comutator pentru telefon, cu valorile din `Domain/Users/PhoneVerification.cs`: pauza
 * dintre SMS-uri e mai lungă, fiindcă fiecare costă. Nici aici serverul nu impune confirmarea.
 */
export const PHONE_VERIFICATION = {
  codeLength: 6,
  resendCooldownSeconds: 90,
} as const
