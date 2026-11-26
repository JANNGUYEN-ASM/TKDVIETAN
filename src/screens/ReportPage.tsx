import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BrandHeader } from '../components/BrandHeader'
import { formatMoney, isoToVi } from '../lib/format'
import { useStore } from '../store'

export function ReportPage() {
  const { state } = useStore()
  const isAn = state.role === 'an'

  const stats = useMemo(() => {
    const active = state.students.filter((s) => s.status === 'Đang học')
    const activeIds = new Set(active.map((s) => s.id))
    let presentMarks = 0
    let totalMarks = 0
    for (const a of state.attendance) {
      if (!activeIds.has(a.studentId)) continue
      totalMarks += 1
      if (a.status === 'Có mặt' || a.status === 'Trễ') presentMarks += 1
    }
    const rate = totalMarks === 0 ? 0 : Math.round((presentMarks / totalMarks) * 100)

    const debtFees = state.fees.filter((f) => f.status === 'Phải thu')
    const debt = debtFees.reduce((sum, f) => sum + f.amount, 0)

    const cancelled = state.sessions.filter((s) => s.kind === 'cancelled')
    const pendingMakeup = cancelled.filter((s) => !s.makeupSessionId).length
    const makeups = state.sessions.filter((s) => s.kind === 'makeup').length

    const recent = [...state.sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((ses) => {
        if (ses.kind === 'cancelled') {
          return {
            ...ses,
            ok: 0,
            denom: 0,
            pct: 0,
            label: `Hủy${ses.cancelReason ? ` · ${ses.cancelReason}` : ''}${ses.makeupSessionId ? ' · đã bù' : ' · chưa bù'}`,
          }
        }
        const marks = state.attendance.filter((a) => a.sessionId === ses.id)
        const ok = marks.filter((m) => m.status === 'Có mặt' || m.status === 'Trễ').length
        const denom = Math.max(marks.length, active.length, 1)
        return {
          ...ses,
          ok,
          denom: marks.length || active.length,
          pct: Math.round((ok / denom) * 100),
          label: ses.kind === 'makeup' ? 'Tập bù' : undefined,
        }
      })

    return {
      activeCount: active.length,
      rate,
      debt,
      pendingMakeup,
      makeups,
      cancelledCount: cancelled.length,
      debtors: debtFees
        .map((f) => ({
          fee: f,
          student: state.students.find((s) => s.id === f.studentId),
        }))
        .filter((x) => x.student),
      recent,
    }
  }, [state])

  return (
    <>
      <BrandHeader subtitle="Báo cáo nhanh" />
      <div className="main-scroll stack">
        <div className="metrics">
          <div className="metric">
            <div className="value">{stats.activeCount}</div>
            <div className="label">Sĩ số đang học</div>
          </div>
          <div className="metric">
            <div className="value">{stats.rate}%</div>
            <div className="label">Chuyên cần</div>
          </div>
          <div className="metric">
            <div className="value" style={{ fontSize: isAn ? '1rem' : '0.85rem' }}>
              {isAn ? formatMoney(stats.debt) : '•••'}
            </div>
            <div className="label">Công nợ</div>
          </div>
        </div>

        {!isAn && (
          <div className="banner banner-info">
            HLV chỉ xem chuyên cần & sĩ số (không thấy doanh thu) — giả định phân quyền
          </div>
        )}

        <Link to="/sao-luu" className="btn btn-primary btn-block">
          Sao lưu / chuyển dữ liệu sang máy khác
        </Link>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Hủy / tập bù</h3>
          <div className="row between">
            <span>Buổi đã hủy</span>
            <strong>{stats.cancelledCount}</strong>
          </div>
          <div className="row between">
            <span>Chờ lên lịch bù</span>
            <strong style={{ color: stats.pendingMakeup ? 'var(--amber)' : undefined }}>
              {stats.pendingMakeup}
            </strong>
          </div>
          <div className="row between">
            <span>Buổi tập bù đã tạo</span>
            <strong>{stats.makeups}</strong>
          </div>
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Buổi gần đây</h3>
          {stats.recent.length === 0 && <p className="muted">Chưa có buổi.</p>}
          {stats.recent.map((s) => (
            <div key={s.id} className="row between">
              <span>
                {s.dayCode} {isoToVi(s.date)}
                {s.label ? ` · ${s.label}` : ''}
              </span>
              <strong style={{ color: '#111' }}>
                {s.kind === 'cancelled' ? '—' : `${s.pct}% · ${s.ok}/${s.denom}`}
              </strong>
            </div>
          ))}
        </div>

        {isAn && (
          <div className="card stack">
            <h3 style={{ margin: 0 }}>Công nợ gần đây</h3>
            {stats.debtors.length === 0 && <p className="muted">Không còn nợ.</p>}
            {stats.debtors.map(({ fee, student }) => (
              <div key={fee.id} className="row between">
                <div>
                  <strong>{student!.fullName}</strong>
                  <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                    còn nợ · {fee.period}
                  </p>
                </div>
                <strong style={{ color: '#111' }}>{formatMoney(fee.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
