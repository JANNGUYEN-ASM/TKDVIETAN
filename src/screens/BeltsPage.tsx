import { useMemo, useState } from 'react'
import { BeltBadge } from '../components/BeltBadge'
import { BrandHeader } from '../components/BrandHeader'
import { nextBelt } from '../lib/belt'
import { ageYearsFromDob } from '../lib/grade'
import { useStore } from '../store'
import type { AttendanceStatus } from '../types'

export function BeltsPage() {
  const { state, promoteBelts } = useStore()
  const [picked, setPicked] = useState<string[]>([])

  const rows = useMemo(() => {
    return state.students
      .filter((s) => s.status === 'Đang học')
      .slice()
      .sort((a, b) => a.stt - b.stt)
      .map((s) => {
        const age = ageYearsFromDob(s.dob)
        const marks = state.attendance.filter((a) => a.studentId === s.id)
        return {
          student: s,
          age,
          toBelt: age == null ? s.belt : nextBelt(s.belt, age),
          attendance: countMarks(marks.map((mark) => mark.status)),
        }
      })
  }, [state.students, state.attendance])

  const ready = rows.filter((row) => row.age != null && row.age >= 6 && row.toBelt !== row.student.belt)
  const tooYoung = rows.filter((row) => row.age != null && row.age < 6)
  const missingAge = rows.filter((row) => row.age == null)
  const pickedReady = ready.filter((row) => picked.includes(row.student.id))

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function promote() {
    if (pickedReady.length === 0) return
    const names =
      pickedReady.length > 6
        ? `${pickedReady.length} võ sinh`
        : pickedReady.map((row) => row.student.fullName).join(', ')
    const ok = window.confirm(`Thăng 1 cấp cho ${names}?`)
    if (!ok) return
    promoteBelts(pickedReady.map((row) => row.student.id))
    setPicked([])
  }

  return (
    <>
      <BrandHeader subtitle="Cấp đai" />
      <div className="main-scroll stack">
        <div className="card">
          <div className="row between" style={{ gap: 8, alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Sau kỳ thi</h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '8px 10px' }}
              onClick={() =>
                setPicked((current) =>
                  current.length === ready.length ? [] : ready.map((row) => row.student.id),
                )
              }
            >
              {pickedReady.length === ready.length && ready.length > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
            </button>
          </div>
          {ready.length === 0 && <p className="muted">Không có võ sinh để thăng cấp.</p>}
          {ready.map((row) => {
            const on = picked.includes(row.student.id)
            const marks = row.attendance
            return (
              <label
                key={row.student.id}
                className="row between"
                style={{ padding: '12px 0', borderBottom: '1px solid var(--line)', alignItems: 'flex-start', gap: 8 }}
              >
                <span className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={on}
                    aria-label={`Chọn ${row.student.fullName}`}
                    onChange={() => toggle(row.student.id)}
                    style={{ marginTop: 6 }}
                  />
                  <BeltBadge belt={row.student.belt} />
                  <span>
                    <strong>
                      {row.student.stt}. {row.student.fullName}
                    </strong>
                    <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                      {row.age} tuổi · {row.student.belt} → {row.toBelt}
                    </span>
                    {marks.present + marks.late + marks.absent + marks.excused > 0 && (
                      <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                        Có mặt {marks.present} · Trễ {marks.late} · Vắng {marks.absent} · Có phép {marks.excused}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            )
          })}
          <button type="button" className="btn btn-primary btn-block" disabled={pickedReady.length === 0} onClick={promote}>
            Thăng 1 cấp ({pickedReady.length})
          </button>
        </div>

        {tooYoung.length > 0 && (
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Chưa đủ 6 tuổi</h3>
            {tooYoung.map((row) => (
              <div key={row.student.id}>
                {row.student.stt}. {row.student.fullName} · {row.age} tuổi
              </div>
            ))}
          </div>
        )}

        {missingAge.length > 0 && (
          <p className="muted" style={{ margin: 0 }}>
            Chưa có năm sinh: {missingAge.map((row) => row.student.fullName).join(', ')}
          </p>
        )}
      </div>
    </>
  )
}

function countMarks(statuses: AttendanceStatus[]) {
  return {
    present: statuses.filter((status) => status === 'Có mặt').length,
    late: statuses.filter((status) => status === 'Trễ').length,
    absent: statuses.filter((status) => status === 'Vắng').length,
    excused: statuses.filter((status) => status === 'Có phép').length,
  }
}
