import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage, LoginPage, ProjectDetail } from './pages'
import {
  IntellebitIntegrationPage,
  IntellebitUsagePage,
  ProfileDetailPage,
  SettingsLayout,
  SettingsPlaceholder,
} from './pages/settings'
import { WorkspaceList } from './pages/workspace-list'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/workspaces" element={<WorkspaceList />} />
      <Route path="/projects/:projectId?" element={<ProjectDetail />} />
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="intellebit-usage" replace />} />
        <Route path="intellebit-usage" element={<IntellebitUsagePage />} />
        <Route path="integration" element={<IntellebitIntegrationPage />} />
        <Route path="profile" element={<ProfileDetailPage />} />
        <Route
          path="history"
          element={<SettingsPlaceholder title="History" />}
        />
        <Route
          path="billing"
          element={<SettingsPlaceholder title="Billing" />}
        />
      </Route>
    </Routes>
  )
}
