import { NextResponse } from 'next/server'
import { requireIdentity } from '../../../cursor/identity'
import { createInitialState } from '../../../src/data/seed'
import { sql } from '../../../src/lib/db'
import { ensureStudentCodes } from '../../../src/lib/studentCodes'
import type { AppState, Student } from '../../../src/types'

export const dynamic = 'force-dynamic'

type Row = { payload: AppState | Record<string, unknown>; updated_at: string }

function normalizeState(raw: unknown): AppState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const obj = raw as Partial<AppState>
  if (!Array.isArray(obj.students) || obj.students.length === 0) {
    // empty payload → seed sample so first open isn't blank
    if (!obj.students) return base
  }
  const students = ensureStudentCodes((obj.students || base.students) as Student[])
  return {
    ...base,
    ...obj,
    settings: { ...base.settings, ...(obj.settings || {}) },
    students,
    sessions: (obj.sessions || base.sessions).map((s) => ({
      ...s,
      kind: s.kind || 'regular',
    })),
    attendance: obj.attendance || base.attendance,
    fees: obj.fees || base.fees,
    role: obj.role === 'hlv' ? 'hlv' : 'an',
  }
}

export async function GET(request: Request) {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity

  const rowId = identity.stage === 'preview' ? 'preview' : 'default'
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
    return NextResponse.json(
      { state: initial, updatedAt: new Date().toISOString(), viewer: identity.email || identity.name },
      { headers: { 'cache-control': 'private, no-store' } },
    )
  }

  return NextResponse.json(
    {
      state: normalizeState(row.payload),
      updatedAt: row.updated_at,
      viewer: identity.email || identity.name,
    },
    { headers: { 'cache-control': 'private, no-store' } },
  )
}

export async function PUT(request: Request) {
  const identity = await requireIdentity(request)
  if (identity instanceof Response) return identity

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const rowId = identity.stage === 'preview' ? 'preview' : 'default'
  const state = normalizeState((body as { state?: unknown })?.state ?? body)
  await sql(
    `insert into club_data (id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
    [rowId, JSON.stringify(state)],
  )

  return NextResponse.json(
    { ok: true, updatedAt: new Date().toISOString(), viewer: identity.email || identity.name },
    { headers: { 'cache-control': 'private, no-store' } },
  )
}
