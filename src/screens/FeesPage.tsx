import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { formatMoney } from '../lib/format'
import { useStore } from '../store'
import { EXTRA_FEE_MODES, type FeeMode, type FeeStatus } from '../types'

export function FeesPage() {
  const { state, upsertFee, updateSettings, setDefaultFee } = useStore()
  const [mode, setMode] = useState<FeeMode>('tháng')
  const [month, setMonth] = useState('2026-11')
  const [coursePeriod, setCoursePeriod] = useState(state.settings.defaultCourse || 'I-25')
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null)

  if (state.role === 'hlv') {
    return <Navigate to="/bao-cao" replace />
  }

  const period = mode === 'tháng' ? month : coursePeriod
  const defaultFee = state.settings.defaultFee

  const rows = useMemo(() => {
    const fees = state.fees.filter((f) => f.mode === mode && f.period === period)
    const byStudent = new Map(fees.map((f) => [f.studentId, f]))
    return state.students
      .slice()
      .sort((a, b) => a.stt - b.stt)
      .map((s) => {
        let fee = byStudent.get(s.id)
        if (!fee) {
          fee = {
            id: `auto-${mode}-${period}-${s.id}`,
            studentId: s.id,
            mode,
            period,
            amount: defaultFee,
            status: s.status === 'Nghỉ học' ? 'Miễn' : 'Chưa thu',
          }
        }
        return { student: s, fee }
      })
  }, [state.students, state.fees, mode, period, defaultFee])

  const totals = [...rows.map((r) => r.fee), ...state.fees.filter((f) => !['tháng', 'khóa'].includes(f.mode))].reduce(
    (acc, fee) => {
      if (fee.status === 'Miễn') return acc
      acc.due += fee.amount
      if (fee.status === 'Đã thu') acc.paid += fee.amount
      else acc.debt += fee.amount
      return acc
    },
    { due: 0, paid: 0, debt: 0 },
  )

  function saveExtra(
    studentId: string,
    extra: (typeof EXTRA_FEE_MODES)[number],
    patch: { amount?: number; status?: FeeStatus },
  ) {
    const id = `extra-${extra}-${studentId}`
    const existing = state.fees.find((f) => f.id === id)
    upsertFee({
      id,
      studentId,
      mode: extra,
      period: 'một lần',
      amount: patch.amount ?? existing?.amount ?? 0,
      status: patch.status ?? existing?.status ?? 'Chưa thu',
    })
  }

  function saveFee(feeId: string, studentId: string, patch: { amount?: number; status?: FeeStatus }) {
    const existing = state.fees.find((f) => f.id === feeId)
    upsertFee({
      id: feeId,
      studentId,
      mode,
      period,
      amount: patch.amount ?? existing?.amount ?? defaultFee,
      status: patch.status ?? existing?.status ?? 'Chưa thu',
    })
  }

  return (
    <>
      <BrandHeader subtitle="Học phí" />
      <div className="main-scroll stack">
        <div className="card form-grid">
          <label>
            Mức học phí mặc định (đ)
            <input
              type="number"
              min={0}
              step={50000}
              value={defaultFee}
              onChange={(e) => setDefaultFee(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="seg">
          <button type="button" className={mode === 'tháng' ? 'active' : ''} onClick={() => setMode('tháng')}>
            Theo tháng
          </button>
          <button type="button" className={mode === 'khóa' ? 'active' : ''} onClick={() => setMode('khóa')}>
            Theo khóa
          </button>
        </div>

        {mode === 'tháng' ? (
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="search" />
        ) : (
          <label className="card form-grid" style={{ margin: 0 }}>
            Mã khóa
            <input
              value={coursePeriod}
              onChange={(e) => {
                setCoursePeriod(e.target.value)
                updateSettings({ defaultCourse: e.target.value })
              }}
              placeholder="I-25"
            />
          </label>
        )}

        <div className="metrics">
          <div className="metric">
            <div className="value" style={{ fontSize: '0.95rem' }}>
              {formatMoney(totals.due)}
            </div>
            <div className="label">Chưa thu</div>
          </div>
          <div className="metric">
            <div className="value" style={{ fontSize: '0.95rem', color: 'var(--green)' }}>
              {formatMoney(totals.paid)}
            </div>
            <div className="label">Đã thu</div>
          </div>
          <div className="metric">
            <div className="value" style={{ fontSize: '0.95rem' }}>
              {formatMoney(totals.debt)}
            </div>
            <div className="label">Còn nợ</div>
          </div>
        </div>

        <div className="card">
          {rows.map(({ student, fee }) => (
            <div
              key={student.id}
              className="stack"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}
            >
              <div className="row between">
                <div>
                  <strong>{student.fullName}</strong>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>
                    {mode === 'khóa' ? `Khóa ${period}` : `Tháng ${month}`}
                    {student.course ? ` · HS: ${student.course}` : ''}
                  </p>
                </div>
                <select
                  value={fee.status}
                  onChange={(e) =>
                    saveFee(fee.id, student.id, { status: e.target.value as FeeStatus, amount: fee.amount })
                  }
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontWeight: 700,
                  }}
                >
                  <option>Chưa thu</option>
                  <option>Đã thu</option>
                  <option>Miễn</option>
                </select>
              </div>

              <div className="row between">
                {editingAmountId === fee.id ? (
                  <input
                    type="number"
                    className="search"
                    style={{ maxWidth: 180 }}
                    autoFocus
                    defaultValue={fee.amount}
                    onBlur={(e) => {
                      saveFee(fee.id, student.id, {
                        amount: Number(e.target.value) || 0,
                        status: fee.status,
                      })
                      setEditingAmountId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px' }}
                    onClick={() => setEditingAmountId(fee.id)}
                  >
                    {fee.status === 'Miễn' ? '—' : formatMoney(fee.amount)} · sửa số
                  </button>
                )}
                {fee.status === 'Chưa thu' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    onClick={() => saveFee(fee.id, student.id, { status: 'Đã thu', amount: fee.amount })}
                  >
                    Ghi đã thu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Khoản khác</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Võ phục, dụng cụ, lệ phí thi và lệ phí thi lên đẳng. Tự điền số tiền, thu một lần.
          </p>
          {state.students.length === 0 && <p className="muted">Chưa có võ sinh.</p>}
          {state.students
            .slice()
            .sort((a, b) => a.stt - b.stt)
            .map((student) => (
              <div key={student.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <strong>{student.fullName}</strong>
                {EXTRA_FEE_MODES.map((extra) => {
                  const saved = state.fees.find((f) => f.studentId === student.id && f.mode === extra)
                  const amount = saved?.amount ?? 0
                  const status = saved?.status ?? 'Chưa thu'
                  return (
                    <div key={extra} className="row between" style={{ marginTop: 8, gap: 8 }}>
                      <span style={{ minWidth: 140 }}>{extra}</span>
                      <input
                        type="number"
                        min={0}
                        value={amount}
                        aria-label={`${extra} ${student.fullName}`}
                        onChange={(e) =>
                          saveExtra(student.id, extra, {
                            amount: Number(e.target.value) || 0,
                            status,
                          })
                        }
                        style={{ width: 120, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px' }}
                      />
                      <select
                        value={status}
                        aria-label={`Trạng thái ${extra} ${student.fullName}`}
                        onChange={(e) =>
                          saveExtra(student.id, extra, {
                            amount,
                            status: e.target.value as FeeStatus,
                          })
                        }
                        style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', fontWeight: 700 }}
                      >
                        <option>Chưa thu</option>
                        <option>Đã thu</option>
                        <option>Miễn</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            ))}
        </div>
      </div>
    </>
  )
}
