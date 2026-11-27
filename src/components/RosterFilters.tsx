import { useMemo } from 'react'
import { COLOR_BELTS, beltLabel, beltSortValue } from '../lib/belt'
import { dobSortValue, incompleteStudent } from '../lib/format'
import type { BeltRank, Gender, Student, StudentStatus } from '../types'

export type RosterFilter = 'all' | StudentStatus | 'missing'
export type RosterSort = 'stt' | 'dob' | 'belt'
export type SortDir = 'asc' | 'desc'

export type RosterQuery = {
  q: string
  filter: RosterFilter
  belt: '' | BeltRank
  gender: '' | Gender
  sort: RosterSort
  sortDir: SortDir
  hideQuit: boolean
}

export function emptyRosterQuery(hideQuit = false): RosterQuery {
  return { q: '', filter: 'all', belt: '', gender: '', sort: 'stt', sortDir: 'asc', hideQuit }
}

export function applyRosterQuery(students: Student[], query: RosterQuery): Student[] {
  const text = query.q.trim().toLowerCase()
  return students
    .filter((student) => {
      if (query.filter === 'Đang học' || query.filter === 'Nghỉ học') return student.status === query.filter
      if (query.filter === 'missing') return incompleteStudent(student).length > 0
      return true
    })
    .filter((student) => (query.belt ? student.belt === query.belt : true))
    .filter((student) => (query.gender ? student.gender === query.gender : true))
    .filter((student) => !(query.hideQuit && query.filter !== 'Nghỉ học' && student.status === 'Nghỉ học'))
    .filter((student) => {
      if (!text) return true
      return (
        student.fullName.toLowerCase().includes(text) ||
        (student.maHV || '').toLowerCase().includes(text) ||
        (student.maDinhDanh || '').toLowerCase().includes(text) ||
        student.phone.includes(text) ||
        student.course.toLowerCase().includes(text) ||
        student.address.toLowerCase().includes(text)
      )
    })
    .slice()
    .sort((a, b) => {
      const direction = query.sortDir === 'asc' ? 1 : -1
      if (query.sort === 'dob') return (dobSortValue(a.dob) - dobSortValue(b.dob) || a.stt - b.stt) * direction
      if (query.sort === 'belt') return (beltSortValue(a.belt) - beltSortValue(b.belt) || a.stt - b.stt) * direction
      return (a.stt - b.stt) * direction
    })
}

export function RosterFilters({
  students,
  query,
  onChange,
}: {
  students: Student[]
  query: RosterQuery
  onChange: (next: RosterQuery) => void
}) {
  const beltOptions = useMemo(() => {
    const extra = students.map((student) => student.belt).filter((belt) => !COLOR_BELTS.includes(belt))
    return [...COLOR_BELTS, ...new Set(extra)]
  }, [students])

  function patch(next: Partial<RosterQuery>) {
    onChange({ ...query, ...next })
  }

  return (
    <>
      <input
        className="search"
        placeholder="Tìm tên, mã HV, mã định danh, SĐT…"
        value={query.q}
        onChange={(e) => patch({ q: e.target.value })}
      />
      <div className="filters">
        {(
          [
            ['all', 'Tất cả'],
            ['Đang học', 'Đang học'],
            ['Nghỉ học', 'Nghỉ học'],
            ['missing', 'Thiếu thông tin'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip chip-outline${query.filter === key ? ' active' : ''}`}
            onClick={() => patch({ filter: key })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filters">
        <select className="filter-select" value={query.belt} onChange={(e) => patch({ belt: e.target.value as '' | BeltRank })}>
          <option value="">Cấp đai</option>
          {beltOptions.map((belt) => (
            <option key={belt} value={belt}>
              {beltLabel(belt)}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={query.gender}
          onChange={(e) => patch({ gender: e.target.value as '' | Gender })}
        >
          <option value="">Giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
        <select className="filter-select" value={query.sort} onChange={(e) => patch({ sort: e.target.value as RosterSort })}>
          <option value="stt">STT</option>
          <option value="dob">Ngày sinh</option>
          <option value="belt">Cấp đai</option>
        </select>
        <select
          className="filter-select"
          value={query.sortDir}
          onChange={(e) => patch({ sortDir: e.target.value as SortDir })}
        >
          <option value="asc">Thấp → cao</option>
          <option value="desc">Cao → thấp</option>
        </select>
        <button
          type="button"
          className={`chip chip-outline${query.hideQuit ? ' active' : ''}`}
          onClick={() => patch({ hideQuit: !query.hideQuit })}
        >
          Ẩn nghỉ học
        </button>
      </div>
    </>
  )
}
