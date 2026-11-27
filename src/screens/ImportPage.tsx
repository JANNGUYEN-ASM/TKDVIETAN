import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { downloadStudentsExcel } from '../lib/exportExcel'
import { parseImportFile } from '../lib/importExcel'
import { useStore } from '../store'
import type { Student } from '../types'

export function ImportPage() {
  const { state, replaceStudents } = useStore()
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Student[]>([])
  const [error, setError] = useState('')

  async function onFile(file: File | null) {
    setError('')
    setPreview([])
    if (!file) return
    try {
      const result = await parseImportFile(file)
      setFileName(file.name)
      setHeaders(result.headers)
      setHeaderMap(result.headerMap)
      setPreview(result.students)
      if (!result.students.length) setError('Không đọc được võ sinh nào. Kiểm tra tên cột Excel.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đọc file')
    }
  }

  function commit(mode: 'merge' | 'replace') {
    if (!preview.length) return
    replaceStudents(preview, mode)
    navigate('/')
  }

  return (
    <>
      <BrandHeader subtitle="Nhập Excel" />
      <div className="main-scroll stack">
        <Link to="/" className="muted">
          ← Danh sách
        </Link>

        <div className="card stack">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => downloadStudentsExcel(state.students)}
          >
            Tải file Excel
          </button>
          <label className="btn btn-ghost btn-block" style={{ cursor: 'pointer' }}>
            Chọn file Excel / CSV
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </label>
          {fileName && (
            <p>
              <strong>{fileName}</strong> — đã tải
            </p>
          )}
          {error && <div className="banner banner-warn">{error}</div>}
        </div>

        {headers.length > 0 && (
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Ánh xạ cột</h3>
            {headers.map((h) => (
              <div key={h} className="row between" style={{ fontSize: '0.9rem' }}>
                <span>{h || '(trống)'}</span>
                <span className="muted">→</span>
                <strong>{headerMap[h] ? labelField(headerMap[h]) : 'Bỏ qua'}</strong>
              </div>
            ))}
          </div>
        )}

        {preview.length > 0 && (
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Xem trước ({preview.length} võ sinh)</h3>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và tên</th>
                    <th>Ngày sinh</th>
                    <th>GT</th>
                    <th>Trình độ</th>
                    <th>Cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((s) => (
                    <tr key={s.id}>
                      <td>{s.stt}</td>
                      <td>{s.fullName}</td>
                      <td>{s.dob}</td>
                      <td>{s.gender}</td>
                      <td>{s.gradeDisplay}</td>
                      <td>{s.belt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => commit('merge')}>
                Nhập / gộp {preview.length} võ sinh
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => commit('replace')}>
                Thay toàn bộ danh sách
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function labelField(key: string) {
  const map: Record<string, string> = {
    stt: 'STT',
    maDinhDanh: 'Mã định danh',
    maHV: 'Mã HV',
    fullName: 'Họ và tên',
    dob: 'Ngày sinh',
    gender: 'Giới tính',
    grade: 'Trình độ',
    belt: 'Cấp bậc',
    joinDate: 'Ngày vào lớp',
    note: 'Ghi chú',
    course: 'KHÓA',
    phone: 'SĐT',
    address: 'Địa chỉ',
    status: 'Trạng thái',
  }
  return map[key] || key
}
