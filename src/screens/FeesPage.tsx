import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { applyRosterQuery, emptyRosterQuery, RosterFilters, type RosterQuery } from '../components/RosterFilters'
import { SIBLING_MONTH_FEE } from '../data/seed'
import { formatMoney, quarterLabel } from '../lib/format'
import { useStore } from '../store'
import { EXAM_ROUNDS, EXTRA_FEE_MODES, TUITION_FEE_MODES, type FeeRecord, type FeeStatus, type Student } from '../types'

export function FeesPage() {
  const { state, upsertFee, updateSettings, setDefaultFee } = useStore()
  const [mode, setMode] = useState<(typeof TUITION_FEE_MODES)[number]>('tháng')
  const [month, setMonth] = useState('2026-11')
  const [coursePeriod, setCoursePeriod] = useState(state.settings.defaultCourse || 'I-25')
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null)
  const [openStudentId, setOpenStudentId] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [query, setQuery] = useState<RosterQuery>(emptyRosterQuery(true))

  if (state.role === 'hlv') {
    return <Navigate to="/bao-cao" replace />
  }

  const period = mode === 'tháng' ? month : mode === 'quý' ? quarterKey(month) : coursePeriod
  const defaultFee = mode === 'quý' ? state.settings.defaultQuarterFee : state.settings.defaultFee
  const examYear = Number(month.slice(0, 4)) || new Date().getFullYear()

  const rows = useMemo(() => {
    const fees = state.fees.filter((f) => f.mode === mode && f.period === period)
    const byStudent = new Map(fees.map((f) => [f.studentId, f]))
    return applyRosterQuery(state.students, query).map((student) => {
      const fee = byStudent.get(student.id) ?? {
        id: `auto-${mode}-${period}-${student.id}`,
        studentId: student.id,
        mode,
        period,
        amount: defaultFee,
        status: 'Chưa thu' as const,
      }
      return { student, fee }
    })
  }, [state.students, state.fees, mode, period, defaultFee, query])

  const selectedStudent = state.students.find((student) => student.id === openStudentId) ?? null
  const selected = selectedStudent
    ? (rows.find((row) => row.student.id === selectedStudent.id) ?? {
        student: selectedStudent,
        fee: feeForStudent(selectedStudent, state.fees, mode, period, defaultFee),
      })
    : null

  const activeIds = new Set(rows.map((row) => row.student.id))
  const totals = [
    ...rows.map((r) => r.fee),
    ...state.fees.filter((f) => !(TUITION_FEE_MODES as readonly string[]).includes(f.mode) && activeIds.has(f.studentId)),
  ].reduce(
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
    chargePeriod: string,
    patch: { amount?: number; status?: FeeStatus },
    existingId?: string,
  ) {
    const legacy = state.fees.find((fee) => fee.studentId === studentId && fee.mode === extra && fee.period === chargePeriod)
    const id = existingId || legacy?.id || `extra-${extra}-${chargePeriod}-${studentId}`
    const existing = state.fees.find((fee) => fee.id === id)
    upsertFee({
      id,
      studentId,
      mode: extra,
      period: chargePeriod,
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
        {!selected && <div className="card stack">
          <button
            type="button"
            className="row between"
            style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', width: '100%' }}
            onClick={() => setShowSetup((open) => !open)}
          >
            <strong>Tùy chỉnh học phí</strong>
            <span className="muted">{showSetup ? 'Thu gọn' : 'Mở'}</span>
          </button>
          {showSetup && (
            <div className="stack form-grid">
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
              <label>
                Mức đóng quý (đ)
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={state.settings.defaultQuarterFee}
                  onChange={(e) => updateSettings({ defaultQuarterFee: Number(e.target.value) || 0 })}
                />
              </label>
              <div className="seg seg-3">
                <button type="button" className={mode === 'tháng' ? 'active' : ''} onClick={() => setMode('tháng')}>
                  Tháng
                </button>
                <button type="button" className={mode === 'quý' ? 'active' : ''} onClick={() => setMode('quý')}>
                  Quý
                </button>
                <button type="button" className={mode === 'khóa' ? 'active' : ''} onClick={() => setMode('khóa')}>
                  Khóa
                </button>
              </div>
              {mode === 'khóa' && (
                <label>
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
            </div>
          )}
        </div>}

        {!selected && <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {mode === 'khóa' ? (
            <span className="chip chip-outline active">Khóa {coursePeriod || '—'}</span>
          ) : (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="search" aria-label="Kỳ học phí" />
          )}
          {mode === 'quý' && <span className="chip chip-outline active">{quarterLabel(`${month}-01`)} · {formatMoney(defaultFee)}</span>}
        </div>}

        {!selected && <RosterFilters students={state.students} query={query} onChange={setQuery} />}

        {!selected && <div className="metrics">
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
        </div>}

        {selected ? (
          <StudentFeeDetail
            student={selected.student}
            fee={selected.fee}
            extras={state.fees.filter((f) => f.studentId === selected.student.id)}
            editingAmountId={editingAmountId}
            onBack={() => setOpenStudentId(null)}
            onEditAmount={() => setEditingAmountId(selected.fee.id)}
            onSaveAmount={(amount) => {
              saveFee(selected.fee.id, selected.student.id, { amount, status: selected.fee.status })
              setEditingAmountId(null)
            }}
            onStatus={(status) =>
              saveFee(selected.fee.id, selected.student.id, { status, amount: selected.fee.amount })
            }
            showSibling={mode === 'tháng'}
            onSibling={() =>
              saveFee(selected.fee.id, selected.student.id, {
                amount: SIBLING_MONTH_FEE,
                status: selected.fee.status === 'Miễn' ? 'Chưa thu' : selected.fee.status,
              })
            }
            examYear={examYear}
            examRounds={EXAM_ROUNDS.map((round) => ({
              round,
              fee: examFeeFor(state.fees, selected.student.id, examYear, round),
            }))}
            onExam={(round, patch, existingId) =>
              saveExtra(selected.student.id, 'lệ phí thi', `${examYear}-L${round}`, patch, existingId)
            }
            onExtra={(extra, patch) => saveExtra(selected.student.id, extra, 'một lần', patch)}
          />
        ) : (
          <div className="card">
            {rows.length === 0 && <p className="muted">Không có võ sinh trong bộ lọc này.</p>}
            {rows.map(({ student, fee }) => (
              <button
                key={student.id}
                type="button"
                className="fee-line"
                onClick={() => setOpenStudentId(student.id)}
                style={{ width: '100%', background: 'transparent', cursor: 'pointer' }}
              >
                <span className="name">
                  {student.stt}. {student.fullName}
                </span>
                <span>{fee.status === 'Miễn' ? '—' : formatMoney(fee.amount)}</span>
                <span className={`chip ${fee.status === 'Đã thu' ? 'chip-green' : 'chip-outline'}`}>{fee.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function StudentFeeDetail({
  student,
  fee,
  extras,
  editingAmountId,
  showSibling,
  examYear,
  examRounds,
  onBack,
  onEditAmount,
  onSaveAmount,
  onStatus,
  onSibling,
  onExam,
  onExtra,
}: {
  student: Student
  fee: FeeRecord
  extras: FeeRecord[]
  editingAmountId: string | null
  showSibling: boolean
  examYear: number
  examRounds: { round: number; fee?: FeeRecord }[]
  onBack: () => void
  onEditAmount: () => void
  onSaveAmount: (amount: number) => void
  onStatus: (status: FeeStatus) => void
  onSibling: () => void
  onExam: (round: number, patch: { amount?: number; status?: FeeStatus }, existingId?: string) => void
  onExtra: (extra: (typeof EXTRA_FEE_MODES)[number], patch: { amount?: number; status?: FeeStatus }) => void
}) {
  const once = extras.filter((item) => item.mode !== 'lệ phí thi')
  return (
    <div className="card stack">
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Danh sách
      </button>
      <h3 style={{ margin: 0 }}>
        {student.stt}. {student.fullName}
      </h3>
      <FeeEditor
        label="Học phí"
        amount={fee.amount}
        status={fee.status}
        editing={editingAmountId === fee.id}
        onEdit={onEditAmount}
        onSaveAmount={onSaveAmount}
        onStatus={onStatus}
      />
      {showSibling && (
        <button type="button" className="btn btn-ghost" onClick={onSibling}>
          Mức 2 anh em {formatMoney(SIBLING_MONTH_FEE)}
        </button>
      )}
      {EXTRA_FEE_MODES.filter((extra) => extra !== 'lệ phí thi').map((extra) => {
        const saved = once.find((item) => item.mode === extra && (item.period === 'một lần' || !item.period))
        return (
          <FeeEditor
            key={extra}
            label={extra}
            amount={saved?.amount ?? 0}
            status={saved?.status ?? 'Chưa thu'}
            editing={false}
            onSaveAmount={(amount) => onExtra(extra, { amount, status: saved?.status ?? 'Chưa thu' })}
            onStatus={(status) => onExtra(extra, { amount: saved?.amount ?? 0, status })}
          />
        )
      })}
      <h3 style={{ margin: '8px 0 0' }}>Lệ phí thi {examYear}</h3>
      {examRounds.map(({ round, fee: exam }) => (
        <FeeEditor
          key={round}
          label={`Lần ${round}`}
          amount={exam?.amount ?? 0}
          status={exam?.status ?? 'Chưa thu'}
          editing={false}
          onSaveAmount={(amount) => onExam(round, { amount, status: exam?.status ?? 'Chưa thu' }, exam?.id)}
          onStatus={(status) => onExam(round, { amount: exam?.amount ?? 0, status }, exam?.id)}
        />
      ))}
    </div>
  )
}

function feeForStudent(
  student: Student,
  fees: FeeRecord[],
  mode: FeeRecord['mode'],
  period: string,
  amount: number,
): FeeRecord {
  return (
    fees.find((fee) => fee.studentId === student.id && fee.mode === mode && fee.period === period) ?? {
      id: `auto-${mode}-${period}-${student.id}`,
      studentId: student.id,
      mode,
      period,
      amount,
      status: 'Chưa thu',
    }
  )
}

function quarterKey(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const quarter = Math.floor(((monthNumber || 1) - 1) / 3) + 1
  return `${year || new Date().getFullYear()}-Q${quarter}`
}

function examFeeFor(fees: FeeRecord[], studentId: string, year: number, round: number): FeeRecord | undefined {
  const period = `${year}-L${round}`
  const saved = fees.find((fee) => fee.studentId === studentId && fee.mode === 'lệ phí thi' && fee.period === period)
  if (saved) return saved
  if (round !== 1) return undefined
  return fees.find((fee) => fee.studentId === studentId && fee.mode === 'lệ phí thi' && fee.period === 'một lần')
}

function FeeEditor({
  label,
  amount,
  status,
  editing,
  onEdit,
  onSaveAmount,
  onStatus,
}: {
  label: string
  amount: number
  status: FeeStatus
  editing?: boolean
  onEdit?: () => void
  onSaveAmount: (amount: number) => void
  onStatus: (status: FeeStatus) => void
}) {
  const tuition = label === 'Học phí'
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <div className="row" style={{ gap: 8 }}>
        {tuition && !editing ? (
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onEdit}>
            {status === 'Miễn' ? '—' : formatMoney(amount)}
          </button>
        ) : (
          <input
            type="number"
            min={0}
            autoFocus={tuition && editing}
            defaultValue={tuition ? amount : undefined}
            value={tuition ? undefined : amount}
            aria-label={`Số tiền ${label}`}
            onBlur={
              tuition
                ? (e) => onSaveAmount(Number(e.target.value) || 0)
                : undefined
            }
            onChange={tuition ? undefined : (e) => onSaveAmount(Number(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            style={{ flex: '1 1 120px', minWidth: 0, border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px' }}
          />
        )}
        <select
          value={status}
          aria-label={`Trạng thái ${label}`}
          onChange={(e) => onStatus(e.target.value as FeeStatus)}
          style={{ maxWidth: '48%', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', fontWeight: 700 }}
        >
          <option>Chưa thu</option>
          <option>Đã thu</option>
          <option>Miễn</option>
        </select>
      </div>
    </div>
  )
}
