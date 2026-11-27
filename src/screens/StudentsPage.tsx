import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BeltBadge } from '../components/BeltBadge'
import { BrandHeader } from '../components/BrandHeader'
import { applyRosterQuery, emptyRosterQuery, RosterFilters, type RosterQuery } from '../components/RosterFilters'
import { isWhiteBelt } from '../lib/belt'
import { downloadStudentsExcel, downloadWhiteBeltExcel } from '../lib/exportExcel'
import { incompleteStudent, initials } from '../lib/format'
import { useStore } from '../store'

export function StudentsPage() {
  const { state } = useStore()
  const [query, setQuery] = useState<RosterQuery>(emptyRosterQuery())

  const whiteCount = state.students.filter((s) => isWhiteBelt(s.belt)).length
  const list = useMemo(() => applyRosterQuery(state.students, query), [state.students, query])

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
                window.alert('Chưa có võ sinh đai trắng (Cấp 10).')
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
            onClick={() => setQuery({ ...query, filter: 'missing' })}
          >
            {missingCount} thiếu SĐT / địa chỉ / khóa
          </button>
        )}

        <RosterFilters students={state.students} query={query} onChange={setQuery} />

        <p className="roster-count">
          {state.students.filter((s) => s.status === 'Đang học').length} đang học
          {state.students.some((s) => s.status === 'Nghỉ học')
            ? ` · ${state.students.filter((s) => s.status === 'Nghỉ học').length} nghỉ học`
            : ''}
          {list.length !== state.students.length ? ` · đang hiện ${list.length}` : ''}
        </p>

        <div className="card">
          {list.length === 0 && state.students.length === 0 && (
            <p className="muted">Chưa có võ sinh.</p>
          )}
          {list.length === 0 && state.students.length > 0 && (
            <p className="muted">Không có võ sinh trong bộ lọc này.</p>
          )}
          {list.map((s, index) => {
            const miss = incompleteStudent(s)
            const order = query.sort === 'stt' ? s.stt : index + 1
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
      </div>
    </>
  )
}
