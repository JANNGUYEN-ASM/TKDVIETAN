import type { VerifiedIdentity } from '../../cursor/identity'

const SUB_PATTERN = /^[\w:.-]{1,120}$/

/**
 * The club book belongs to one signed-in person.
 * Another Cursor account cannot read or replace it, and a public caller never gets a book.
 */
export function bookFor(
  identity: VerifiedIdentity,
): { rowId: string; legacyId: 'default' | 'preview' } | null {
  if (identity.kind !== 'person') return null
  if (identity.claims.app_visibility === 'public') return null
  if (!SUB_PATTERN.test(identity.sub)) return null
  if (identity.appVisibility === 'team' && identity.teamRole !== 'admin' && identity.teamRole !== 'member') {
    return null
  }
  const stage = identity.stage === 'preview' ? 'preview' : 'production'
  return {
    rowId: `book:${stage}:${identity.sub}`,
    legacyId: stage === 'preview' ? 'preview' : 'default',
  }
}
