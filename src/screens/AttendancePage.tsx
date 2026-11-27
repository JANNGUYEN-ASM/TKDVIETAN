import { useEffect, useMemo, useState } from 'react'
import { BrandHeader } from '../components/BrandHeader'
import { CLASS_TIME } from '../data/seed'
import {
  WEEKDAY_CODES,
  addDays,
  dayCodeFromIso,
  eachDay,
  endOfMonth,
  isoToVi,
  quarterInfo,
  quarterLabel,
  sessionDayLabel,
  shiftPeriod,
  startOfMonth,
  startOfWeek,
  todayIso,
} from '../lib/format'
import { useStore } from '../store'
import type { AttendanceStatus, CancelReason, ClassSession, SessionDay } from '../types'

const STATUSES: AttendanceStatus[] = ['Có mặt', 'Vắng', 'Có phép', 'Trễ']
const CANCEL_REASONS: CancelReason[] = ['Mưa', 'Có việc', 'Khác']
type Period = 'week' | 'month' | 'quarter'

export function AttendancePage() {
  const {
    state,
    ensureSession,
    getOrCreateSession,
    cancelSession,
    reopenSession,
    scheduleMakeup,
    saveAttendanceBulk,
  } = useStore()

  const [date, setDate] = useState(() => todayIso())
  const [period, setPeriod] = useState<Period>('week')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState<CancelReason>('Mưa')
  const [makeupDate, setMakeupDate] = useState('')
  const [pickedSessionId, setPickedSessionId] = useState<string | null>(null)

  const sessionsOnDate = useMemo(
    () => state.sessions.filter((s) => s.date === date).sort((a, b) => a.id.localeCompare(b.id)),
    [state.sessions, date],
  )

  const session =
    (pickedSessionId && state.sessions.find((s) => s.id === pickedSessionId)) ||
    sessionsOnDate[0] ||
    null

  useEffect(() => {
    // Prefer existing session on this date; else create regular skeleton when An opens the day
    if (sessionsOnDate.length === 0) {
      const created = getOrCreateSession(date)
      setPickedSessionId(created.id)
    } else if (!pickedSessionId || !sessionsOnDate.some((s) => s.id === pickedSessionId)) {
      setPickedSessionId(sessionsOnDate[0].id)
    }
  }, [date, sessionsOnDate, pickedSessionId, getOrCreateSession])

  const sessionId = session?.id || `ses-${date}`
  const dayCode = (session?.dayCode || dayCodeFromIso(date) || 'Bù') as SessionDay
  const isCancelled = session?.kind === 'cancelled'
  const isMakeup = session?.kind === 'makeup'

  const cancelledSource = isMakeup
    ? state.sessions.find((s) => s.id === session?.makeupForSessionId)
    : null
  const linkedMakeup = isCancelled
    ? state.sessions.find((s) => s.id === session?.makeupSessionId)
    : null

  const pendingMakeups = useMemo(
    () =>
      state.sessions.filter(
        (s) => s.kind === 'cancelled' && !s.makeupSessionId,
      ),
    [state.sessions],
  )

  const roster = useMemo(
    () =>
      state.students
        .filter((s) => s.status === 'Đang học')
        .sort((a, b) => a.stt - b.stt),
    [state.students],
  )

  const inactive = useMemo(
    () => state.students.filter((s) => s.status === 'Nghỉ học'),
    [state.students],
  )

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})

  useEffect(() => {
    const init: Record<string, AttendanceStatus> = {}
    for (const a of state.attendance.filter((x) => x.sessionId === sessionId)) {
      init[a.studentId] = a.status
    }
    setMarks(init)
  }, [sessionId, state.attendance])

  function setStatus(studentId: string, status: AttendanceStatus) {
    setMarks((m) => ({ ...m, [studentId]: status }))
  }

  function save() {
    if (isCancelled) {
      alert('Buổi đã hủy — không điểm danh. Hãy lên lịch tập bù.')
      return
    }
    ensureSession({
      id: sessionId,
      date,
      dayCode,
      timeLabel: CLASS_TIME,
      kind: isMakeup ? 'makeup' : 'regular',
      makeupForSessionId: session?.makeupForSessionId,
    })
    const records = Object.entries(marks).map(([studentId, status]) => ({
      sessionId,
      studentId,
      status,
    }))
    saveAttendanceBulk(sessionId, records)
    alert('Đã lưu điểm danh')
  }

  function onCancel() {
    if (!session) return
    cancelSession(session.id, cancelReason)
    setCancelOpen(false)
  }

  function onScheduleMakeup() {
    if (!session || session.kind !== 'cancelled' || !makeupDate) return
    const makeup = scheduleMakeup(session.id, makeupDate)
    if (makeup) {
      setDate(makeup.date)
      setPickedSessionId(makeup.id)
      setMakeupDate('')
    }
  }

  const counts = {
    present: Object.values(marks).filter((s) => s === 'Có mặt').length,
    late: Object.values(marks).filter((s) => s === 'Trễ').length,
    absent: Object.values(marks).filter((s) => s === 'Vắng').length,
    excused: Object.values(marks).filter((s) => s === 'Có phép').length,
  }

  return (
    <>
      <BrandHeader subtitle="Điểm danh buổi" />
      <div className="main-scroll stack">
        <div className="card stack">
          <div className="row between">
            <div>
              <strong>
                {isoToVi(date)} · {sessionDayLabel(dayCode)}
              </strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                {CLASS_TIME}
              </p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '8px 10px' }}
                onClick={() => {
                  setDate(todayIso())
                  setPickedSessionId(null)
                }}
              >
                Hôm nay
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (!e.target.value) return
                  setDate(e.target.value)
                  setPickedSessionId(null)
                }}
                style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px' }}
              />
            </div>
          </div>

          {sessionsOnDate.length > 1 && (
            <div className="filters">
              {sessionsOnDate.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip chip-outline${pickedSessionId === s.id ? ' active' : ''}`}
                  onClick={() => setPickedSessionId(s.id)}
                >
                  {s.kind === 'makeup' ? 'Tập bù' : s.kind === 'cancelled' ? 'Đã hủy' : sessionDayLabel(s.dayCode)}
                </button>
              ))}
            </div>
          )}

          {isMakeup && <span className="chip chip-outline active">Bù</span>}

          <PeriodCards
            date={date}
            period={period}
            today={todayIso()}
            sessions={state.sessions}
            onPeriod={setPeriod}
            onShift={(direction) => {
              const next = shiftPeriod(date, period, direction)
              setDate(next)
              setPickedSessionId(null)
            }}
            onPick={(iso) => {
              setDate(iso)
              setPickedSessionId(null)
            }}
          />

          {isCancelled && (
            <div className="banner banner-warn">
              Buổi đã hủy{session?.cancelReason ? ` — ${session.cancelReason}` : ''}. Không điểm danh.
              {linkedMakeup
                ? ` Đã có tập bù ${isoToVi(linkedMakeup.date)}.`
                : ' Chưa có lịch tập bù.'}
            </div>
          )}

          {isMakeup && cancelledSource && (
            <div className="banner banner-info">
              Tập bù cho buổi {isoToVi(cancelledSource.date)}
              {cancelledSource.cancelReason ? ` (hủy: ${cancelledSource.cancelReason})` : ''}.
            </div>
          )}

          {!isCancelled && session?.kind !== 'makeup' && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setCancelOpen((v) => !v)}>
              Hủy buổi
            </button>
          )}

          {cancelOpen && !isCancelled && (
            <div className="stack">
              <div className="filters">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`chip chip-outline${cancelReason === r ? ' active' : ''}`}
                    onClick={() => setCancelReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-navy btn-block" onClick={onCancel}>
                Xác nhận hủy buổi
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="stack">
              {!linkedMakeup && (
                <>
                  <label className="muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Ngày tập bù
                    <input
                      type="date"
                      className="search"
                      style={{ marginTop: 6 }}
                      value={makeupDate}
                      onChange={(e) => setMakeupDate(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={!makeupDate}
                    onClick={onScheduleMakeup}
                  >
                    Lên lịch tập bù
                  </button>
                </>
              )}
              {linkedMakeup && (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    setDate(linkedMakeup.date)
                    setPickedSessionId(linkedMakeup.id)
                  }}
                >
                  Mở buổi tập bù {isoToVi(linkedMakeup.date)}
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-block" onClick={() => reopenSession(sessionId)}>
                Mở lại buổi (bỏ hủy)
              </button>
            </div>
          )}
        </div>

        {pendingMakeups.length > 0 && (
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Thiếu buổi — chờ tập bù</h3>
            {pendingMakeups.map((s) => (
              <button
                key={s.id}
                type="button"
                className="row between btn-ghost"
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px' }}
                onClick={() => {
                  setDate(s.date)
                  setPickedSessionId(s.id)
                }}
              >
                <span>
                  {isoToVi(s.date)} · {s.cancelReason || 'Hủy'}
                </span>
                <span className="chip chip-amber">Chưa bù</span>
              </button>
            ))}
          </div>
        )}

        {!isCancelled && (
          <>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Danh sách học viên ({roster.length})</h3>
              {roster.map((s) => {
                const st = marks[s.id]
                return (
                  <div
                    key={s.id}
                    className="stack"
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}
                  >
                    <div className="row between">
                      <strong>{s.fullName}</strong>
                      {st && <span className="chip chip-outline">{st}</span>}
                    </div>
                    <div className="status-pills">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={classFor(status, st === status)}
                          onClick={() => setStatus(s.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {inactive.map((s) => (
                <div key={s.id} className="row between" style={{ opacity: 0.55, padding: '10px 0' }}>
                  <div>
                    <strong>{s.fullName}</strong>
                    <p className="meta muted" style={{ margin: 0 }}>
                      Nghỉ học (không trong roster)
                    </p>
                  </div>
                  <span className="chip chip-gray">Nghỉ học</span>
                </div>
              ))}
            </div>

            <div className="card row between" style={{ flexWrap: 'wrap' }}>
              <span>
                Có mặt <strong style={{ color: 'var(--green)' }}>{counts.present}</strong>
              </span>
              <span>
                Trễ <strong style={{ color: 'var(--amber)' }}>{counts.late}</strong>
              </span>
              <span>
                Vắng <strong style={{ color: 'var(--red)' }}>{counts.absent}</strong>
              </span>
              <span>
                Có phép <strong>{counts.excused}</strong>
              </span>
            </div>

            <button type="button" className="btn btn-primary btn-block" onClick={save}>
              Lưu điểm danh
            </button>
          </>
        )}
      </div>
    </>
  )
}

function PeriodCards({
  date,
  period,
  today,
  sessions,
  onPeriod,
  onShift,
  onPick,
}: {
  date: string
  period: Period
  today: string
  sessions: ClassSession[]
  onPeriod: (period: Period) => void
  onShift: (direction: -1 | 1) => void
  onPick: (iso: string) => void
}) {
  const groups = periodGroups(date, period)
  const title =
    period === 'week'
      ? `Tuần ${isoToVi(groups[0].days[0])}–${isoToVi(groups[0].days[groups[0].days.length - 1])}`
      : period === 'month'
        ? `Tháng ${date.slice(5, 7)}/${date.slice(0, 4)}`
        : quarterLabel(date)

  return (
    <div className="stack">
      <div className="seg seg-3">
        {(
          [
            ['week', 'Tuần'],
            ['month', 'Tháng'],
            ['quarter', 'Quý'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" className={period === key ? 'active' : ''} onClick={() => onPeriod(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="row between">
        <button type="button" className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => onShift(-1)}>
          Trước
        </button>
        <strong style={{ textAlign: 'center' }}>{title}</strong>
        <button type="button" className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={() => onShift(1)}>
          Sau
        </button>
      </div>
      {groups.map((group) => (
        <div key={group.key} className="stack">
          {period === 'quarter' && <h3 style={{ margin: 0 }}>{group.label}</h3>}
          <div className="day-grid" aria-hidden>
            {WEEKDAY_CODES.map((code) => (
              <div key={code} className="day-head">
                {code}
              </div>
            ))}
          </div>
          <div className="day-grid">
            {group.blanks.map((blank) => (
              <span key={blank} />
            ))}
            {group.days.map((iso) => {
              const code = dayCodeFromIso(iso)
              const saved = sessions.find((session) => session.date === iso && session.kind !== 'makeup')
              const className = [
                'day-card',
                iso === date ? 'active' : '',
                iso === today ? 'today' : '',
                saved?.kind === 'cancelled' ? 'cancelled' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button key={iso} type="button" className={className} onClick={() => onPick(iso)}>
                  <strong>{Number(iso.slice(8, 10))}</strong>
                  <span>{code}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function periodGroups(date: string, period: Period): { key: string; label: string; days: string[]; blanks: string[] }[] {
  if (period === 'week') {
    const start = startOfWeek(date)
    return [{ key: start, label: '', days: eachDay(start, addDays(start, 6)), blanks: [] }]
  }
  if (period === 'month') {
    return [monthGroup(date)]
  }
  const quarter = quarterInfo(date)
  const months: { key: string; label: string; days: string[]; blanks: string[] }[] = []
  let cursor = quarter.start
  while (cursor <= quarter.end) {
    months.push(monthGroup(cursor))
    const next = parseMonthAfter(cursor)
    if (next <= cursor) break
    cursor = next
  }
  return months
}

function monthGroup(iso: string): { key: string; label: string; days: string[]; blanks: string[] } {
  const start = startOfMonth(iso)
  const weekday = dayCodeFromIso(start)
  const blankCount = Math.max(0, WEEKDAY_CODES.indexOf(weekday || 'T2'))
  return {
    key: start,
    label: `Tháng ${start.slice(5, 7)}/${start.slice(0, 4)}`,
    days: eachDay(start, endOfMonth(iso)),
    blanks: Array.from({ length: blankCount }, (_, index) => `${start}-blank-${index}`),
  }
}

function parseMonthAfter(iso: string): string {
  const [year, month] = iso.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

function classFor(status: AttendanceStatus, on: boolean) {
  if (!on) return ''
  if (status === 'Có mặt') return 'on-present'
  if (status === 'Vắng') return 'on-absent'
  if (status === 'Có phép') return 'on-excused'
  return 'on-late'
}
