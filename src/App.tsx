import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './store'
import { AttendancePage } from './screens/AttendancePage'
import { BeltsPage } from './screens/BeltsPage'
import { FeesPage } from './screens/FeesPage'
import { ImportPage } from './screens/ImportPage'
import { BackupPage } from './screens/BackupPage'
import { ReportPage } from './screens/ReportPage'
import { StudentDetailPage } from './screens/StudentDetailPage'
import { StudentsPage } from './screens/StudentsPage'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<StudentsPage />} />
            <Route path="vo-sinh/moi" element={<StudentDetailPage />} />
            <Route path="vo-sinh/:id" element={<StudentDetailPage />} />
            <Route path="nhap-excel" element={<ImportPage />} />
            <Route path="diem-danh" element={<AttendancePage />} />
            <Route path="hoc-phi" element={<FeesPage />} />
            <Route path="cap-dai" element={<BeltsPage />} />
            <Route path="bao-cao" element={<ReportPage />} />
            <Route path="sao-luu" element={<BackupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
