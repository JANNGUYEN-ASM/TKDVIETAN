import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BeltBadge } from '../components/BeltBadge'
import { BrandHeader } from '../components/BrandHeader'
import { COLOR_BELTS, beltLabel } from '../lib/belt'
import { computeTrinhDo } from '../lib/grade'
import { incompleteStudent, initials, isoDateToVi, viToIso } from '../lib/format'
import { useStore } from '../store'
import type { BeltRank, Gender, Student, StudentStatus } from '../types'

function emptyStudent(stt: number, defaultCourse: string): Student {
  return {
    id: `s-${Date.now()}`,
    stt,
    maDinhDanh: '',
    maHV: '',
    fullName: '',
    dob: '',
    gender: 'Nam',
    gradeDisplay: '',
    belt: 'Nhập môn',
    joinDate: '',
    note: '',
    course: defaultCourse,
    phone: '',
    address: '',
    status: 'Đang học',
  }
}

export function StudentDetailPage() {
  const { id } = useParams()
  const isNew = id === 'moi'
  const { state, upsertStudent, deleteStudent } = useStore()
  const navigate = useNavigate()
  const existing = useMemo(
    () => (isNew ? null : state.students.find((s) => s.id === id) || null),
    [state.students, id, isNew],
  )
  const [editing, setEditing] = useState(isNew)
  const [form, setForm] = useState<Student>(() =>
    existing
      ? { ...existing }
      : emptyStudent(state.students.length + 1, state.settings.defaultCourse),
  )
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (existing && !editing) setForm({ ...existing })
  }, [existing, editing])

  if (!isNew && !existing) {
    return (
      <>
        <BrandHeader subtitle="Chi tiết võ sinh" />
        <div className="main-scroll">
          <p>Không tìm thấy võ sinh.</p>
          <Link to="/">← Danh sách</Link>
        </div>
      </>
    )
  }

  const student = (editing ? form : existing) ?? form
  const missing = incompleteStudent(student)

  function patch<K extends keyof Student>(key: K, value: Student[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'dob' && !f.gradeDisplay.trim()) {
        next.gradeDisplay = computeTrinhDo(String(value), '')
      }
      return next
    })
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    const gradeDisplay =
      form.gradeDisplay.trim() || computeTrinhDo(form.dob, form.gradeDisplay)
    const next = {
      ...form,
      gradeDisplay,
      fullName: form.fullName.trim(),
      maHV: form.maHV.trim(),
      maDinhDanh: form.maDinhDanh.trim(),
    }
    if (!next.fullName) {
      alert('Nhập họ và tên')
      return
    }
    upsertStudent(next)
    setSavedFlash(true)
    setEditing(false)
    navigate(`/vo-sinh/${next.id}`, { replace: true })
    window.setTimeout(() => setSavedFlash(false), 2000)
  }

  function onDelete() {
    if (!existing) return
    if (!confirm(`Xóa võ sinh ${existing.fullName}?`)) return
    deleteStudent(existing.id)
    navigate('/')
  }

  return (
    <>
      <BrandHeader subtitle={isNew ? 'Thêm võ sinh' : 'Chi tiết võ sinh'} />
      <div className="main-scroll stack">
        <Link to="/" className="muted">
          ← Danh sách
        </Link>

        {savedFlash && <div className="banner banner-info">Đã lưu thông tin võ sinh.</div>}

        {!editing && (
          <div className="card stack">
            <div className="row between">
              <div className="row">
                <div className="avatar">{initials(student.fullName)}</div>
                <div>
                  <h2 style={{ margin: 0 }}>{student.fullName}</h2>
                  <p className="meta" style={{ margin: '4px 0 0' }}>
                    {student.maHV || '—'} · {student.maDinhDanh || '—'}
                  </p>
                  <span className={`chip ${student.status === 'Đang học' ? 'chip-green' : 'chip-gray'}`}>
                    {student.status}
                  </span>
                </div>
              </div>
              <BeltBadge belt={student.belt} />
            </div>

            {missing.length > 0 && (
              <div className="banner banner-warn">
                Còn thiếu: {missing.join(', ')} — bấm Sửa / Điền để bổ sung.
              </div>
            )}

            <dl className="field-list">
              <div className="field-row">
                <dt>Mã HV</dt>
                <dd style={{ fontWeight: 800 }}>{student.maHV || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Mã định danh</dt>
                <dd>{student.maDinhDanh || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Họ và tên</dt>
                <dd>{student.fullName}</dd>
              </div>
              <div className="field-row">
                <dt>Ngày sinh</dt>
                <dd>{student.dob || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Giới tính</dt>
                <dd>{student.gender}</dd>
              </div>
              <div className="field-row">
                <dt>Trình độ</dt>
                <dd>{student.gradeDisplay || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Cấp bậc</dt>
                <dd>{student.belt}</dd>
              </div>
              <div className="field-row">
                <dt>Ngày vào lớp</dt>
                <dd>{student.joinDate || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>KHÓA</dt>
                <dd style={{ fontWeight: 800 }}>{student.course || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>SĐT phụ huynh</dt>
                <dd>
                  {student.phone ? (
                    <a href={`tel:${student.phone.replace(/\s/g, '')}`}>{student.phone}</a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="field-row">
                <dt>Địa chỉ</dt>
                <dd>{student.address || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Ghi chú</dt>
                <dd>{student.note || '—'}</dd>
              </div>
              <div className="field-row">
                <dt>Trạng thái</dt>
                <dd>{student.status}</dd>
              </div>
            </dl>

            <div className="actions sticky-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setForm({ ...student })
                  setEditing(true)
                }}
              >
                Sửa / Điền thông tin
              </button>
              <Link to="/diem-danh" className="btn btn-ghost">
                Điểm danh
              </Link>
              <Link to="/hoc-phi" className="btn btn-ghost">
                Học phí
              </Link>
              <button type="button" className="btn btn-ghost" onClick={onDelete}>
                Xóa
              </button>
            </div>
          </div>
        )}

        {editing && (
          <form className="card form-grid" onSubmit={onSave}>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Điền đủ các ô bên dưới rồi bấm <strong>Lưu</strong>. Ngày chọn trên lịch sẽ hiện dạng
              DD/MM/YYYY.
            </p>

            <label>
              Mã HV
              <input
                value={form.maHV}
                placeholder="Mã liên đoàn cấp"
                autoCapitalize="characters"
                onChange={(e) => patch('maHV', e.target.value)}
              />
            </label>

            <label>
              Mã định danh
              <input
                value={form.maDinhDanh}
                placeholder="Mã liên đoàn cấp"
                autoCapitalize="characters"
                onChange={(e) => patch('maDinhDanh', e.target.value)}
              />
            </label>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              Hai mã do liên đoàn cấp. Gõ đúng mã trên giấy tờ, app không tự điền.
            </p>

            <label>
              Họ và tên *
              <input
                required
                autoFocus={isNew}
                value={form.fullName}
                placeholder="Họ và tên võ sinh"
                onChange={(e) => patch('fullName', e.target.value)}
              />
            </label>

            <label>
              Ngày sinh
              <input
                type="date"
                value={viToIso(form.dob)}
                onChange={(e) => patch('dob', isoDateToVi(e.target.value))}
              />
            </label>

            <label>
              Giới tính
              <select value={form.gender} onChange={(e) => patch('gender', e.target.value as Gender)}>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </label>

            <label>
              Trình độ (Lớp N / Đi làm)
              <div className="row" style={{ gap: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={form.gradeDisplay}
                  placeholder="VD: Lớp 7 — hoặc để trống tự tính"
                  onChange={(e) => patch('gradeDisplay', e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => patch('gradeDisplay', computeTrinhDo(form.dob, ''))}
                >
                  Tự tính
                </button>
              </div>
            </label>

            <label>
              Cấp bậc
              <select value={form.belt} onChange={(e) => patch('belt', e.target.value as BeltRank)}>
                {COLOR_BELTS.map((b) => (
                  <option key={b} value={b}>
                    {beltLabel(b)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ngày vào lớp
              <input
                type="date"
                value={viToIso(form.joinDate)}
                onChange={(e) => patch('joinDate', isoDateToVi(e.target.value))}
              />
            </label>

            <label>
              KHÓA
              <input
                value={form.course}
                placeholder={state.settings.defaultCourse || 'VD: I-25'}
                onChange={(e) => patch('course', e.target.value)}
              />
            </label>

            <label>
              SĐT phụ huynh / liên hệ
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                placeholder="SĐT phụ huynh"
                onChange={(e) => patch('phone', e.target.value)}
              />
            </label>

            <label>
              Địa chỉ
              <textarea
                rows={2}
                value={form.address}
                placeholder="Ấp / xã / huyện / tỉnh"
                onChange={(e) => patch('address', e.target.value)}
              />
            </label>

            <label>
              Ghi chú
              <textarea
                rows={2}
                value={form.note}
                placeholder="Ghi chú nội bộ CLB"
                onChange={(e) => patch('note', e.target.value)}
              />
            </label>

            <label>
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => patch('status', e.target.value as StudentStatus)}
              >
                <option>Đang học</option>
                <option>Nghỉ học</option>
              </select>
            </label>

            <div className="actions sticky-actions">
              <button type="submit" className="btn btn-primary btn-block">
                Lưu thông tin
              </button>
              {!isNew && (
                <button type="button" className="btn btn-ghost btn-block" onClick={() => setEditing(false)}>
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  )
}
