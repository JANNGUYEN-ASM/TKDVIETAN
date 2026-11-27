import { NextResponse } from 'next/server'
import { requireIdentity } from '../../../cursor/identity'
import { bookFor } from '../../../src/lib/bookAccess'
import { createInitialState, LEGACY_DEFAULT_FEE } from '../../../src/data/seed'
import { canonicalBelt } from '../../../src/lib/belt'
import { canonicalFee, migrateFeeAmount } from '../../../src/lib/fees'
import { sql } from '../../../src/lib/db'
import { keepClubState } from '../../../src/lib/stripDemo'
import { ensureStudentCodes } from '../../../src/lib/studentCodes'
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
  }
}

function prepareState(raw: unknown): AppState {
  return keepClubState(normalizeState(raw))
}

function studentCount(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0
  const students = (payload as { students?: unknown }).students
  return Array.isArray(students) ? students.length : 0
}

async function openBook(request: Request) {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity
  const book = bookFor(identity)
  if (!book) return json({ error: 'forbidden' }, 403)
  return book
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
  const { rowId, legacyId } = book
  let rows = await sql<Row>('select payload, updated_at from club_data where id = $1', [rowId])
  let row = rows[0]
  if (!row || studentCount(row.payload) === 0) {
    const legacyRows = await sql<Row>('select payload, updated_at from club_data where id = $1', [legacyId])
    const legacy = legacyRows[0]
    if (legacy && studentCount(legacy.payload) > 0) {
      await sql(
        `insert into club_data (id, payload, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
        [rowId, JSON.stringify(legacy.payload)],
      )
      row = { payload: legacy.payload, updated_at: legacy.updated_at }
    }
  }
  if (!row || !row.payload || Object.keys(row.payload as object).length === 0) {
    const initial = createInitialState()
    await sql(
      `insert into club_data (id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do nothing`,
      [rowId, JSON.stringify(initial)],
    )
    return json({ state: initial, updatedAt: new Date().toISOString() })
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
  const state = prepareState((body as { state?: unknown })?.state ?? body)
  await sql(
    `insert into club_data (id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
    [rowId, JSON.stringify(state)],
  )

  return json({ ok: true, updatedAt: new Date().toISOString() })
}
