/**
 * Adevărat doar în browserul fără interfață care pre-randează paginile la build
 * (`scripts/prerender.mjs` pune semnul înainte să pornească aplicația).
 *
 * De folosit rar, pentru ce n-are cum să ajungă într-o pagină salvată: o hartă are nevoie de WebGL
 * și de rețea, iar browserul de build nu are niciuna. Fără gardă, pagina cu hartă cade cu totul.
 */
export const IS_PRERENDER =
  typeof window !== 'undefined' && (window as { __PRERENDER__?: boolean }).__PRERENDER__ === true
