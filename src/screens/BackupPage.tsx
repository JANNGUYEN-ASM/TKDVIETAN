import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { downloadBackup, parseBackup } from '../lib/backup'
import { downloadStudentsExcel } from '../lib/exportExcel'
import { useStore } from '../store'

export function BackupPage() {
  const { state, replaceAllState } = useStore()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function onExport() {
    setError('')
    const name = downloadBackup(state)
    localStorage.setItem('viet-an-last-export', new Date().toISOString())
    setMessage(
      `Đã tải ${name}. Gửi Zalo/Drive sang máy kia (không cần cùng Wi‑Fi) → máy kia mở Sao lưu → Nhập file.`,
    )
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
        setMessage('Đã mở chia sẻ — gửi file (Zalo…) rồi Nhập file trên máy/điện thoại kia.')
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
        !confirm(
          `Nhập file này sẽ THAY toàn bộ dữ liệu trên máy/điện thoại HIỆN TẠI bằng ${next.students.length} võ sinh. Tiếp tục?`,
        )
      ) {
        return
      }
      replaceAllState(next)
      setMessage(
        `Đã nhập xong: ${next.students.length} võ sinh, ${next.sessions.length} buổi, ${next.fees.length} khoản phí. Máy này giờ khớp file vừa nhận.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file')
    }
  }

  const lastExport = localStorage.getItem('viet-an-last-export')

  return (
    <>
      <BrandHeader subtitle="Sao lưu / chuyển máy" />
      <div className="main-scroll stack">
        <Link to="/bao-cao" className="muted">
          ← Báo cáo
        </Link>

        <div className="banner banner-warn">
          <strong>Phone khác Wi‑Fi / khác nơi với máy chủ?</strong> Server local{' '}
          <em>không tự biết</em> phone vừa nhập gì. Phải gửi file sao lưu (hoặc sau này dùng cloud).
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Tình huống đúng của An</h3>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.9rem', color: 'var(--muted)' }}>
            <li>
              Điện thoại (4G hoặc Wi‑Fi quán) nhập điểm danh / võ sinh → dữ liệu chỉ nằm trên phone.
            </li>
            <li>
              Bấm <strong>Chia sẻ / Tải file</strong> bên dưới → gửi Zalo cho máy ở nhà (hoặc cho chính
              mình).
            </li>
            <li>
              Máy chủ/PC mở app → trang này → <strong>Nhập file</strong> → máy chủ mới có bản mới.
            </li>
            <li>Làm ngược lại nếu sửa trên PC rồi muốn phone khớp.</li>
          </ol>
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>1. Xuất từ máy / phone đang cầm</h3>
          <p className="muted" style={{ margin: 0 }}>
            Đang có <strong>{state.students.length}</strong> võ sinh ·{' '}
            <strong>{state.sessions.length}</strong> buổi · <strong>{state.fees.length}</strong> học phí.
            {lastExport ? (
              <>
                {' '}
                Lần xuất gần nhất: {new Date(lastExport).toLocaleString('vi-VN')}
              </>
            ) : (
              <> Chưa xuất file lần nào trên trình duyệt này.</>
            )}
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
          <h3 style={{ margin: 0 }}>2. Nhập trên máy kia</h3>
          <p className="muted" style={{ margin: 0 }}>
            Không cần cùng Wi‑Fi. Chỉ cần nhận được file và chọn ở đây.
          </p>
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

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Muốn tự động (không gửi file)?</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            Cần app host trên internet + database chung. Khi đó phone ở đâu cũng ghi lên server, máy chủ
            mở vào là thấy. Hiện chưa bật — dùng file tạm thời.
          </p>
        </div>
      </div>
    </>
  )
}
