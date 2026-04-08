import { Navigate, Route, Routes } from 'react-router-dom'
import DesktopShellApp from '@/desktop-shell/DesktopShellApp'
import AuthLayout from '@/layouts/AuthLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import VerifyActivationPage from '@/pages/auth/VerifyActivationPage'
import Register from '@/pages/Register'
import { isDesktopRuntime } from '@/platform/runtime'
import WorkspaceRoutes from '@/routes/WorkspaceRoutes'

function WebAppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>

      <Route path="/register" element={<AuthLayout />}>
        <Route index element={<Register />} />
      </Route>

      <Route path="/verify-activation" element={<AuthLayout />}>
        <Route index element={<VerifyActivationPage />} />
      </Route>

      <Route path="/*" element={<WorkspaceRoutes fallbackPath="/" />} />
    </Routes>
  )
}

function App() {
  if (isDesktopRuntime()) {
    return <DesktopShellApp />
  }

  return <WebAppRoutes />
}

export default App
