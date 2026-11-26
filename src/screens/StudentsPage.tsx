import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BeltBadge } from '../components/BeltBadge'
import { BrandHeader } from '../components/BrandHeader'
import { COLOR_BELTS, beltLabel, isWhiteBelt } from '../lib/belt'
import { downloadStudentsExcel, downloadWhiteBeltExcel } from '../lib/exportExcel'
import { dobSortValue, incompleteStudent, initials } from '../lib/format'
import { useStore } from '../store'
import type { BeltRank, Gender, StudentStatus } from '../types'

type Filter = 'all' | StudentStatus | 'course' | 'missing'
type DobSort = 'stt' | 'dob'

export function StudentsPage() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [belt, setBelt] = useState<'' | BeltRank>('')
  const [gender, setGender] = useState<'' | Gender>('')
  const [sort, setSort] = useState<DobSort>('stt')

  const beltOptions = useMemo(() => {
    const extra = state.students
      .map((s) => s.belt)
      .filter((b) => !COLOR_BELTS.includes(b))
    return [...COLOR_BELTS, ...new Set(extra)]
  }, [state.students])

  const whiteCount = state.students.filter((s) => isWhiteBelt(s.belt)).length

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return state.students
      .filter((s) => {
        if (filter === 'Đang học' || filter === 'Nghỉ học') return s.status === filter
        if (filter === 'course') return s.course === state.settings.defaultCourse || s.course === 'I-25'
        if (filter === 'missing') return incompleteStudent(s).length > 0
        return true
      })
      .filter((s) => (belt ? s.belt === belt : true))
      .filter((s) => (gender ? s.gender === gender : true))
      .filter((s) => {
        if (!query) return true
        return (
          s.fullName.toLowerCase().includes(query) ||
          (s.maHV || '').toLowerCase().includes(query) ||
          (s.maDinhDanh || '').toLowerCase().includes(query) ||
          s.phone.includes(query) ||
          s.course.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) =>
        sort === 'dob' ? dobSortValue(a.dob) - dobSortValue(b.dob) || a.stt - b.stt : a.stt - b.stt,
      )
  }, [state.students, state.settings.defaultCourse, q, filter, belt, gender, sort])

  const missingCount = state.students.filter((s) => incompleteStudent(s).length > 0).length

  return (
    <>
      <BrandHeader subtitle="Danh sách võ sinh" />
      <div className="main-scroll stack">
        <div className="actions">
          <Link to="/vo-sinh/moi" className="btn btn-primary">
            + Thêm võ sinh
          </Link>
          <Link to="/nhap-excel" className="btn btn-ghost">
            Nhập Excel
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => downloadStudentsExcel(state.students)}>
            Tải Excel
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const result = downloadWhiteBeltExcel(state.students)
              if (result.count === 0) {
                window.alert('Chưa có võ sinh đai trắng (Cấp 10 hoặc Nhập môn).')
              }
            }}
          >
            Excel đai trắng ({whiteCount})
          </button>
          <Link to="/sao-luu" className="btn btn-ghost">
            Sao lưu
          </Link>
        </div>

        {missingCount > 0 && (
          <button
            type="button"
            className="banner banner-warn"
            style={{ border: 'none', textAlign: 'left', width: '100%' }}
            onClick={() => setFilter('missing')}
          >
            {missingCount} võ sinh còn thiếu SĐT / địa chỉ / khóa — bấm để lọc và điền.
          </button>
        )}

        <input
          className="search"
          placeholder="Tìm tên, mã HV, mã định danh, SĐT…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="filters">
          {(
            [
              ['all', 'Tất cả'],
              ['Đang học', 'Đang học'],
              ['Nghỉ học', 'Nghỉ học'],
              ['course', `Khóa ${state.settings.defaultCourse || 'I-25'}`],
              ['missing', 'Thiếu thông tin'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip chip-outline${filter === key ? ' active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filters">
          <select className="filter-select" value={belt} onChange={(e) => setBelt(e.target.value as '' | BeltRank)}>
            <option value="">Mọi cấp đai</option>
            {beltOptions.map((b) => (
              <option key={b} value={b}>
                {beltLabel(b)}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={gender}
            onChange={(e) => setGender(e.target.value as '' | Gender)}
          >
            <option value="">Mọi giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
          <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as DobSort)}>
            <option value="stt">Sắp theo STT</option>
            <option value="dob">Ngày sinh thấp → cao</option>
          </select>
        </div>

        <p className="roster-count">
          {state.students.length} học viên
          {list.length !== state.students.length ? ` · đang hiện ${list.length}` : ''}
        </p>

        <div className="card">
          {list.length === 0 && (
            <p className="muted">
              Chưa có võ sinh.{' '}
              <Link to="/vo-sinh/moi">Thêm mới</Link> hoặc <Link to="/nhap-excel">nhập Excel</Link>.
            </p>
          )}
          {list.map((s, index) => {
            const miss = incompleteStudent(s)
            const order = sort === 'dob' ? index + 1 : s.stt
            return (
              <Link key={s.id} to={`/vo-sinh/${s.id}`} className="student-item">
                <span className="stt-col">{order}</span>
                <div className="avatar">{initials(s.fullName)}</div>
                <div>
                  <h3>{s.fullName}</h3>
                  <p className="meta">
                    {s.maHV || '—'}
                    {s.maDinhDanh ? ` · ${s.maDinhDanh}` : ''}
                    {s.gradeDisplay ? ` · ${s.gradeDisplay}` : ''}
                    {s.course ? ` · ${s.course}` : ''}
                  </p>
                  <span className={`chip ${s.status === 'Đang học' ? 'chip-green' : 'chip-gray'}`}>
                    {s.status}
                  </span>
                  {miss.length > 0 && (
                    <span className="chip chip-amber" style={{ marginLeft: 6 }}>
                      Thiếu {miss.join(', ')}
                    </span>
                  )}
                </div>
                <BeltBadge belt={s.belt} />
              </Link>
            )
          })}
        </div>

        <div className="card table-wrap desktop-only">
          <table className="data">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã HV</th>
                <th>Mã ĐD</th>
                <th>Họ và tên</th>
                <th>Ngày sinh</th>
                <th>GT</th>
                <th>Trình độ</th>
                <th>Cấp bậc</th>
                <th>KHÓA</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s, index) => (
                <tr key={s.id}>
                  <td>{sort === 'dob' ? index + 1 : s.stt}</td>
                  <td>{s.maHV || '—'}</td>
                  <td>{s.maDinhDanh || '—'}</td>
                  <td>
                    <Link to={`/vo-sinh/${s.id}`}>{s.fullName}</Link>
                  </td>
                  <td>{s.dob}</td>
                  <td>{s.gender}</td>
                  <td>{s.gradeDisplay}</td>
                  <td>{s.belt}</td>
                  <td>{s.course || '—'}</td>
                  <td>{s.status}</td>
                  <td>
                    <Link to={`/vo-sinh/${s.id}`}>Điền / Sửa</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
