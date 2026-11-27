import { createHash } from 'node:crypto'
import { normalizeSyncCode } from './syncCode'

export function clubRowId(raw: string): string | null {
  const code = normalizeSyncCode(raw)
  if (!code) return null
  return `club:${createHash('sha256').update(code).digest('hex')}`
}
