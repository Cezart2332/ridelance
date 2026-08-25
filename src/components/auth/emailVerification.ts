/**
 * Starea confirmării adresei de email.
 *
 * **Confirmarea nu e impusă.** Codul se trimite și poate fi introdus, dar contul funcționează
 * complet fără el: autentificarea nu îl verifică, pagina de confirmare lasă utilizatorul mai
 * departe, iar un cod greșit nu oprește fluxul.
 *
 * `required` e comutatorul. Pe `true`:
 *   - un cod greșit oprește pasul, în loc să lase utilizatorul să treacă;
 *   - linkul „Continuă" dispare.
 *
 * Nu e suficient. Ca regula să fie reală, mai trebuie și partea de server —
 * `LoginUserCommandHandler` să refuze un cont neconfirmat — plus o decizie despre conturile
 * existente, care sunt toate neconfirmate. Vezi `Domain/Users/EmailVerification.cs`.
 */
export const EMAIL_VERIFICATION = {
  required: false,
  codeLength: 6,
  resendCooldownSeconds: 60,
} as const
