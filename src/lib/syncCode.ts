export const SYNC_HEADER = 'x-club-sync'
export const SYNC_CODE_KEY = 'viet-an-sync-code'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeSyncCode(raw: string): string | null {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compact.length !== 12) return null
  for (const char of compact) {
    if (!ALPHABET.includes(char)) return null
  }
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8)}`
}

export function createSyncCode(): string {
  const bytes = new Uint8Array(12)
  globalThis.crypto.getRandomValues(bytes)
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8).join('')}`
}
