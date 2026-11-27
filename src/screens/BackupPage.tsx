import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { downloadBackup, parseBackup } from '../lib/backup'
import { downloadStudentsExcel } from '../lib/exportExcel'
import { useStore } from '../store'

export function BackupPage() {
  const { state, replaceAllState, clearAllData } = useStore()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function onExport() {
    setError('')
    const name = downloadBackup(state)
    localStorage.setItem('viet-an-last-export', new Date().toISOString())
    setMessage(`Đã tải ${name}`)
  }

  async function onShare() {
    setError('')
    try {
      const backup = {
        app: 'clb-taekwondo-viet-an',
        version: 1,
        exportedAt: new Date().toISOString(),
        state,
      }
      const text = JSON.stringify(backup, null, 2)
      const file = new File([text], `viet-an-backup-${new Date().toISOString().slice(0, 10)}.json`, {
        type: 'application/json',
      })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sao lưu CLB Việt An',
          text: 'File dữ liệu CLB TAEKWONDO VIỆT AN',
        })
        localStorage.setItem('viet-an-last-export', new Date().toISOString())
        setMessage('Đã mở chia sẻ')
        return
      }
      onExport()
    } catch {
      onExport()
    }
  }

  async function onImport(file: File | null) {
    setError('')
    setMessage('')
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text) as unknown
      const next = parseBackup(json)
      if (
        !confirm(`Nhập ${next.students.length} võ sinh và thay dữ liệu hiện tại?`)
      ) {
        return
      }
      replaceAllState(next)
      setMessage(`Đã nhập ${next.students.length} võ sinh`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file')
    }
  }

  return (
    <>
      <BrandHeader subtitle="Sao lưu / chuyển máy" />
      <div className="main-scroll stack">
        <Link to="/bao-cao" className="muted">
          ← Báo cáo
        </Link>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Xóa hết</h3>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => {
              const ok = window.confirm('Xóa hết võ sinh, điểm danh và học phí?')
              if (!ok) return
              clearAllData()
              setError('')
              setMessage('Đã xóa')
            }}
          >
            Xóa hết dữ liệu
          </button>
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Xuất</h3>
          <p className="muted" style={{ margin: 0 }}>
            {state.students.length} võ sinh · {state.sessions.length} buổi · {state.fees.length} học phí
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={onShare}>
            Chia sẻ file qua Zalo / Drive…
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onExport}>
            Tải file sao lưu (.json)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => downloadStudentsExcel(state.students)}
          >
            Tải file Excel (.xlsx)
          </button>
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Nhập</h3>
          <label className="btn btn-navy btn-block" style={{ cursor: 'pointer' }}>
            Chọn file .json để nhập
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => onImport(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {message && <div className="banner banner-info">{message}</div>}
        {error && <div className="banner banner-warn">{error}</div>}
      </div>
    </>
  )
}
