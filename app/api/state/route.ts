import { NextResponse } from 'next/server'
import { requireIdentity } from '../../../cursor/identity'
import { createInitialState } from '../../../src/data/seed'
import { sql } from '../../../src/lib/db'
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
  const students = ensureStudentCodes(
    take<Student>(obj.students, obj.students ? [] : base.students, 2000),
  )
  const settings = obj.settings
  return {
    role: obj.role === 'hlv' ? 'hlv' : 'an',
    settings: {
      defaultFee:
        typeof settings?.defaultFee === 'number' && Number.isFinite(settings.defaultFee)
          ? settings.defaultFee
          : base.settings.defaultFee,
      defaultCourse:
        typeof settings?.defaultCourse === 'string'
          ? settings.defaultCourse.slice(0, 80)
          : base.settings.defaultCourse,
    },
    students,
    sessions: take<ClassSession>(obj.sessions, base.sessions, 4000).map((s) => ({
      ...s,
      kind: s.kind || 'regular',
    })),
    attendance: take<AttendanceRecord>(obj.attendance, base.attendance, 20000),
    fees: take<FeeRecord>(obj.fees, base.fees, 8000),
  }
}

async function openBook(request: Request) {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity
  return {
    rowId: identity.stage === 'preview' ? 'preview' : 'default',
    viewer: identity.email || identity.name || 'CLB',
  }
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
  const { rowId, viewer } = book
  const rows = await sql<Row>('select payload, updated_at from club_data where id = $1', [rowId])
  const row = rows[0]
  if (!row || !row.payload || Object.keys(row.payload as object).length === 0) {
    const initial = createInitialState()
    await sql(
      `insert into club_data (id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
      [rowId, JSON.stringify(initial)],
    )
    return json({ state: initial, updatedAt: new Date().toISOString(), viewer })
  }

  return json({
    state: normalizeState(row.payload),
    updatedAt: row.updated_at,
    viewer,
  })
}

export async function PUT(request: Request) {
  const book = await openBook(request)
  if (book instanceof Response) return book
  const { rowId, viewer } = book

  const raw = await request.text()
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const state = normalizeState((body as { state?: unknown })?.state ?? body)
  await sql(
    `insert into club_data (id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
    [rowId, JSON.stringify(state)],
  )

  return json({ ok: true, updatedAt: new Date().toISOString(), viewer })
}
