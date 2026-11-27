import type { VerifiedIdentity } from '../../cursor/identity'

const SUB_PATTERN = /^[\w:.-]{1,120}$/

/**
 * The club book belongs to one signed-in person.
 * Another Cursor account cannot read or replace it.
 * A public link has no signed-in book; those devices share a database only with the club sync code.
 */
export function bookFor(identity: VerifiedIdentity): { rowId: string } | null {
  if (identity.kind !== 'person') return null
  if (identity.claims.app_visibility === 'public') return null
  if (!SUB_PATTERN.test(identity.sub)) return null
  if (identity.appVisibility === 'team' && identity.teamRole !== 'admin' && identity.teamRole !== 'member') {
    return null
  }
  const stage = identity.stage === 'preview' ? 'preview' : 'production'
  return { rowId: `book:${stage}:${identity.sub}` }
}
