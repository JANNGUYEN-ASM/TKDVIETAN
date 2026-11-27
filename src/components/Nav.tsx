import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store'

const links = [
  { to: '/', label: 'Võ sinh', end: true },
  { to: '/diem-danh', label: 'Điểm danh' },
  { to: '/hoc-phi', label: 'Học phí', anOnly: true },
  { to: '/cap-dai', label: 'Cấp đai' },
  { to: '/bao-cao', label: 'Báo cáo' },
  { to: '/sao-luu', label: 'Sao lưu' },
]

export function BottomNav() {
  const { state } = useStore()
  const location = useLocation()
  const visible = links.filter((l) => !(l.anOnly && state.role === 'hlv'))
  // Keep 4 slots on phone: hide Cấp đai from bottom, keep in sidebar
  // Phone: keep 4 tabs; Sao lưu + Cấp đai vào từ Báo cáo / sidebar
  const phone = visible.filter((l) => l.to !== '/cap-dai' && l.to !== '/sao-luu').slice(0, 4)

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {phone.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => {
            const onStudents =
              l.to === '/' &&
              (location.pathname.startsWith('/vo-sinh') || location.pathname.startsWith('/nhap-excel'))
            return isActive || onStudents ? 'active' : ''
          }}
        >
          <span aria-hidden>{icon(l.to)}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function DesktopSidebar() {
  const { state } = useStore()
  const visible = links.filter((l) => !(l.anOnly && state.role === 'hlv'))

  return (
    <aside className="desktop-sidebar">
      <div className="brand-block">
        <img
          src="/logo-viet-an.png"
          alt="Logo VIỆT AN"
          width={72}
          height={72}
          style={{ borderRadius: '50%', background: '#fff', display: 'block', marginBottom: 12 }}
        />
        <h1>
          CLB TAEKWONDO <span style={{ color: 'var(--accent)' }}>VIỆT AN</span>
        </h1>
      </div>
      {visible.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
      <div style={{ marginTop: 'auto', padding: '12px 8px', display: 'grid', gap: 8 }}>
        <NavLink to="/sao-luu" className="btn btn-primary btn-block" style={{ textAlign: 'center' }}>
          Sao lưu / chuyển máy
        </NavLink>
      </div>
    </aside>
  )
}

function icon(to: string) {
  switch (to) {
    case '/':
      return 'VS'
    case '/diem-danh':
      return 'DD'
    case '/hoc-phi':
      return 'HP'
    case '/bao-cao':
      return 'BC'
    default:
      return '·'
  }
}
