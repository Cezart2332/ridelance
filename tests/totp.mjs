// Codul TOTP (RFC 6238) al conturilor de echipă din seed-ul e2e
// (AccountingE2ESeed.TwoFactorSecret), ca testele să treacă de pasul 2FA.
import { createHmac } from 'node:crypto'

export const E2E_TWO_FACTOR_SECRET = 'KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU'

function base32(text) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const ch of text.replace(/=+$/, '')) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0')
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

export function totp(secret = E2E_TWO_FACTOR_SECRET, now = Date.now()) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)))
  const hash = createHmac('sha1', base32(secret)).update(counter).digest()
  const offset = hash[hash.length - 1] & 0x0f
  const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(code).padStart(6, '0')
}
