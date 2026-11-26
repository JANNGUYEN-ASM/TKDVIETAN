import { useEffect, useMemo, useState } from 'react'
import { BrandHeader } from '../components/BrandHeader'
import { CLASS_TIME } from '../data/seed'
import { dayCodeFromIso, isoToVi, sessionDayLabel, todayIso } from '../lib/format'
import { useStore } from '../store'
import type { AttendanceStatus, CancelReason, SessionDay } from '../types'

const STATUSES: AttendanceStatus[] = ['Có mặt', 'Vắng', 'Có phép', 'Trễ']
const CANCEL_REASONS: CancelReason[] = ['Mưa', 'Có việc', 'Khác']

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

  const [date, setDate] = useState(() => {
    const t = todayIso()
    return dayCodeFromIso(t) ? t : '2025-11-25'
  })
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
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setPickedSessionId(null)
              }}
              style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px' }}
            />
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

          {!dayCodeFromIso(date) && !isMakeup && (
            <div className="banner banner-warn">
              Ngày này không phải T3/T5/CN — dùng được cho tập bù hoặc buổi phát sinh.
            </div>
          )}

          <div className="filters">
            {(['T3', 'T5', 'CN'] as const).map((d) => (
              <span key={d} className={`chip chip-outline${dayCode === d ? ' active' : ''}`}>
                {d}
              </span>
            ))}
            {isMakeup && <span className="chip chip-outline active">Bù</span>}
          </div>

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
              Hủy buổi (mưa / có việc…)
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

function classFor(status: AttendanceStatus, on: boolean) {
  if (!on) return ''
  if (status === 'Có mặt') return 'on-present'
  if (status === 'Vắng') return 'on-absent'
  if (status === 'Có phép') return 'on-excused'
  return 'on-late'
}
