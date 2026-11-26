import { Outlet } from 'react-router-dom'
import { BottomNav, DesktopSidebar } from './Nav'

export function Layout() {
  return (
    <div className="app-shell">
      <DesktopSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100dvh' }}>
        <div className="main-scroll" style={{ flex: 1, padding: 0 }}>
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
