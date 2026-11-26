import { useMemo } from 'react'
import { BeltBadge } from '../components/BeltBadge'
import { BrandHeader } from '../components/BrandHeader'
import { nextBelt } from '../lib/belt'
import { ageYearsFromDob } from '../lib/grade'
import { useStore } from '../store'

export function BeltsPage() {
  const { state, upsertStudent } = useStore()

  const rows = useMemo(() => {
    return state.students
      .filter((s) => s.status === 'Đang học')
      .map((s) => {
        const age = ageYearsFromDob(s.dob) ?? 12
        const toBelt = nextBelt(s.belt, age)
        const sessions = state.sessions
        const present = state.attendance.filter(
          (a) => a.studentId === s.id && (a.status === 'Có mặt' || a.status === 'Trễ'),
        ).length
        const totalPossible = Math.max(sessions.length, 1)
        const rate = present / totalPossible
        const eligible = rate >= 0.5 || sessions.length === 0
        return {
          student: s,
          toBelt,
          eligible,
          reason: eligible ? 'Đủ thi' : 'Thiếu chuyên cần',
        }
      })
  }, [state.students, state.attendance, state.sessions])

  function promote(studentId: string) {
    const row = rows.find((r) => r.student.id === studentId)
    if (!row) return
    upsertStudent({ ...row.student, belt: row.toBelt })
  }

  return (
    <>
      <BrandHeader subtitle="Cấp đai" />
      <div className="main-scroll stack">
        <div className="banner banner-warn">Dữ liệu CLB — không phải chứng chỉ liên đoàn</div>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Nhập môn → Cấp 9…Cấp 1 → dưới 15: Đai đen đỏ (Poom) / từ 15: Đai đen + đẳng.
        </p>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Đủ điều kiện thi</h3>
          {rows.map((r) => (
            <div
              key={r.student.id}
              className="row between"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}
            >
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <BeltBadge belt={r.student.belt} />
                <div>
                  <strong>{r.student.fullName}</strong>
                  <p className="muted" style={{ margin: '4px 0' }}>
                    {r.student.belt} → {r.toBelt}
                  </p>
                  <span className={`chip ${r.eligible ? 'chip-green' : 'chip-amber'}`}>{r.reason}</span>
                </div>
              </div>
              {r.eligible && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={() => promote(r.student.id)}
                >
                  Đánh dấu đã thi
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
