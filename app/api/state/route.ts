import { NextResponse } from 'next/server'
import { getIdentity } from '../../../cursor/identity'
import { bookFor } from '../../../src/lib/bookAccess'
import { createInitialState, DEFAULT_QUARTER_FEE, LEGACY_DEFAULT_FEE } from '../../../src/data/seed'
import { canonicalBelt } from '../../../src/lib/belt'
import { canonicalFee, migrateFeeAmount } from '../../../src/lib/fees'
import { sql } from '../../../src/lib/db'
import { mergeClubState, removedIds, revisionOf } from '../../../src/lib/mergeState'
import { keepClubState } from '../../../src/lib/stripDemo'
import { ensureStudentCodes } from '../../../src/lib/studentCodes'
import { clubRowId } from '../../../src/lib/syncBook'
import { SYNC_HEADER } from '../../../src/lib/syncCode'
import type { AppState, AttendanceRecord, ClassSession, FeeRecord, Student } from '../../../src/types'

export const dynamic = 'force-dynamic'

const MAX_BODY = 400_000

type Row = { payload: AppState | Record<string, unknown>; updated_at: string }

function take<T>(value: unknown, fallback: T[], max: number): T[] {
  if (!Array.isArray(value)) return fallback
  return value.slice(0, max) as T[]
}

function normalizeState(raw: unknown): AppState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const obj = raw as Partial<AppState>
  const legacyFee = obj.settings?.defaultFee === LEGACY_DEFAULT_FEE
  const students = ensureStudentCodes(take<Student>(obj.students, [], 2000)).map((student) => ({
    ...student,
    belt: canonicalBelt(student.belt),
  }))
  const settings = obj.settings
  return {
    role: obj.role === 'hlv' ? 'hlv' : 'an',
    settings: {
      defaultFee:
        typeof settings?.defaultFee === 'number' && Number.isFinite(settings.defaultFee)
          ? legacyFee
            ? base.settings.defaultFee
            : settings.defaultFee
          : base.settings.defaultFee,
      defaultQuarterFee:
        typeof settings?.defaultQuarterFee === 'number' &&
        Number.isFinite(settings.defaultQuarterFee) &&
        settings.defaultQuarterFee >= 0
          ? settings.defaultQuarterFee
          : DEFAULT_QUARTER_FEE,
      defaultCourse:
        typeof settings?.defaultCourse === 'string'
          ? settings.defaultCourse.slice(0, 80)
          : base.settings.defaultCourse,
    },
    students,
    sessions: take<ClassSession>(obj.sessions, [], 4000).map((s) => ({
      ...s,
      kind: s.kind || 'regular',
    })),
    attendance: take<AttendanceRecord>(obj.attendance, [], 20000),
    fees: take<FeeRecord>(obj.fees, [], 8000).map((fee) => {
      const next = canonicalFee(fee)
      return { ...next, amount: migrateFeeAmount(next.amount, next.mode, legacyFee) }
    }),
    removedStudentIds: removedIds(obj.removedStudentIds),
    revision: revisionOf(obj.revision),
  }
}

function prepareState(raw: unknown): AppState {
  return keepClubState(normalizeState(raw))
}

async function openBook(request: Request) {
  const identity = await getIdentity(request)
  if (identity.verified) {
    const book = bookFor(identity)
    if (book) return book
  }
  const rowId = clubRowId(request.headers.get(SYNC_HEADER) || '')
  if (!rowId) return json({ error: 'unauthorized' }, 401)
  return { rowId }
}

async function clubHasRoom(rowId: string): Promise<boolean> {
  if (!rowId.startsWith('club:')) return true
  const existing = await sql<{ id: string }>('select id from club_data where id = $1', [rowId])
  if (existing.length > 0) return true
  const counts = await sql<{ n: number }>('select count(*)::int as n from club_data where id like $1', ['club:%'])
  return Number(counts[0]?.n ?? 0) < 20
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'private, no-store' },
  })
}

export async function GET(request: Request) {
  const book = await openBook(request)
  if (book instanceof Response) return book
  const { rowId } = book
  const rows = await sql<Row>('select payload, updated_at from club_data where id = $1', [rowId])
  const row = rows[0]
  if (!row || !row.payload || Object.keys(row.payload as object).length === 0) {
    return json({ error: 'not_found' }, 404)
  }

  return json({
    state: prepareState(row.payload),
    updatedAt: row.updated_at,
  })
}

export async function PUT(request: Request) {
  const book = await openBook(request)
  if (book instanceof Response) return book
  const { rowId } = book

  const raw = await request.text()
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  if (!(await clubHasRoom(rowId))) return json({ error: 'full' }, 429)
  const payload = body as { state?: unknown; replace?: unknown }
  const incoming = prepareState(payload.state ?? body)
  const replace = payload.replace === true
  const existingRows = await sql<Row>('select payload, updated_at from club_data where id = $1', [rowId])
  const existing = existingRows[0]
  const existingState =
    existing?.payload && Object.keys(existing.payload as object).length > 0
      ? prepareState(existing.payload)
      : null
  if (replace) {
    incoming.revision = revisionOf(existingState?.revision) + 1
  } else if (existingState && revisionOf(incoming.revision) < revisionOf(existingState.revision)) {
    return json({ error: 'stale', state: existingState }, 409)
  }
  const state = !replace && existingState ? mergeClubState(incoming, existingState) : incoming
  await sql(
    `insert into club_data (id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
    [rowId, JSON.stringify(state)],
  )

  return json({ ok: true, state, updatedAt: new Date().toISOString() })
}
