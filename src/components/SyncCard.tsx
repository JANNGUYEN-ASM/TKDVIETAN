import { useState } from 'react'
import { useStore } from '../store'

export function SyncCard() {
  const { syncCode, syncLabel, createClubSync, joinClubSync } = useStore()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function createCode() {
    setBusy(true)
    setMessage('')
    const code = await createClubSync()
    setMessage(code ? '' : 'Chưa tạo được mã. Thử lại.')
    setBusy(false)
  }

  async function joinCode() {
    setBusy(true)
    const error = await joinClubSync(draft)
    setMessage(error)
    if (!error) setDraft('')
    setBusy(false)
  }

  return (
    <div className="card stack">
      <strong>Đồng bộ điện thoại và máy tính</strong>
      <p className="muted" style={{ margin: 0 }}>
        Danh sách nhập trên điện thoại đang nằm trong máy đó. Tạo một mã trên điện thoại, rồi nhập đúng mã này trên máy kia để cả hai dùng chung database.
      </p>
      {syncCode ? (
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.08em' }}>{syncCode}</p>
      ) : null}
      <p className="muted" style={{ margin: 0 }}>
        {syncLabel}
      </p>
      {message ? <p style={{ margin: 0 }}>{message}</p> : null}
      {!syncCode && (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void createCode()}>
          Tạo mã trên máy này
        </button>
      )}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          className="search"
          style={{ flex: 1, minWidth: 180 }}
          value={draft}
          placeholder="Nhập mã máy kia"
          autoCapitalize="characters"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" className="btn btn-ghost" disabled={busy || !draft.trim()} onClick={() => void joinCode()}>
          Lấy dữ liệu
        </button>
      </div>
    </div>
  )
}
