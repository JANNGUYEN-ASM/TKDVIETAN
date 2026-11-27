type Bucket = { hits: number; start: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 2000

/** True when this key has already passed `limit` calls inside `windowMs`. */
export function tooMany(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    const oldest = buckets.keys().next().value
    if (oldest) buckets.delete(oldest)
  }
  const current = buckets.get(key)
  if (!current || now - current.start >= windowMs) {
    buckets.set(key, { hits: 1, start: now })
    return false
  }
  current.hits += 1
  return current.hits > limit
}
