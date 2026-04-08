import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { hasPlanFeature } from '@/data/subscriptionPlans'
import DashboardLayout from '@/layouts/DashboardLayout'
import SuperAdminLayout from '@/layouts/SuperAdminLayout'
import { useAuth } from '@/hooks/useAuth'
import Dashboard from '@/pages/Dashboard'
import InvoiceSettings from '@/pages/settings/InvoiceSettings'
import ProfileSettings from '@/pages/settings/ProfileSettings'
import SmsSettings from '@/pages/settings/SmsSettings'
import Team from '@/pages/settings/Team'
import CourierSettings from '@/pages/settings/CourierSettings'
import WhatsAppSettings from '@/pages/settings/WhatsAppSettings'

const Orders = lazy(() => import('@/pages/Orders'))
const Customers = lazy(() => import('@/pages/Customers'))
const Inventory = lazy(() => import('@/pages/Inventory'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const Reports = lazy(() => import('@/pages/Reports'))
const SyncIssues = lazy(() => import('@/pages/SyncIssues'))
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard'))
const ManageSellers = lazy(() => import('@/pages/admin/ManageSellers'))
const SubscriptionPlans = lazy(() => import('@/pages/admin/SubscriptionPlans'))

function PageFallback() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-white/50 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-40 rounded-[24px] bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RoleGuard({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

function TenantGuard({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin/dashboard" replace />
  }

  return children
}

function SuperAdminGuard({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

function FeatureGuard({ featureKey, fallbackPath = '/app/dashboard', children }) {
  const { business } = useAuth()

  if (!hasPlanFeature(business, featureKey)) {
    return <Navigate to={fallbackPath} replace />
  }

  return children
}

function WorkspaceRoutes({ fallbackPath = '/app/dashboard', onLogout }) {
  return (
    <Routes>
      <Route path="/app" element={<TenantGuard><DashboardLayout onLogout={onLogout} /></TenantGuard>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Suspense fallback={<PageFallback />}><Orders /></Suspense>} />
        <Route path="customers" element={<Suspense fallback={<PageFallback />}><Customers /></Suspense>} />
        <Route path="inventory" element={<FeatureGuard featureKey="inventory"><Suspense fallback={<PageFallback />}><Inventory /></Suspense></FeatureGuard>} />
        <Route path="expenses" element={<FeatureGuard featureKey="expenses"><Suspense fallback={<PageFallback />}><Expenses /></Suspense></FeatureGuard>} />
        <Route path="sync-issues" element={<Suspense fallback={<PageFallback />}><SyncIssues /></Suspense>} />
        <Route path="reports" element={<RoleGuard><FeatureGuard featureKey="reports"><Suspense fallback={<PageFallback />}><Reports /></Suspense></FeatureGuard></RoleGuard>} />
        <Route path="settings" element={<Navigate to="/app/settings/profile" replace />} />
        <Route path="settings/profile" element={<RoleGuard><ProfileSettings /></RoleGuard>} />
        <Route path="settings/invoice" element={<RoleGuard><InvoiceSettings /></RoleGuard>} />
        <Route path="settings/sms" element={<RoleGuard><SmsSettings /></RoleGuard>} />
        <Route path="settings/team" element={<RoleGuard><FeatureGuard featureKey="teamManagement"><Team /></FeatureGuard></RoleGuard>} />
        <Route path="settings/whatsapp" element={<RoleGuard><WhatsAppSettings /></RoleGuard>} />
        <Route path="settings/courier" element={<RoleGuard><FeatureGuard featureKey="courierSync"><CourierSettings /></FeatureGuard></RoleGuard>} />
      </Route>

      <Route
        path="/super-admin"
        element={<SuperAdminGuard><SuperAdminLayout onLogout={onLogout} /></SuperAdminGuard>}
      >
        <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<PageFallback />}><SuperAdminDashboard /></Suspense>} />
        <Route path="sellers" element={<Suspense fallback={<PageFallback />}><ManageSellers /></Suspense>} />
        <Route path="subscriptions" element={<Suspense fallback={<PageFallback />}><SubscriptionPlans /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to={fallbackPath} replace />} />
    </Routes>
  )
}

export default WorkspaceRoutes
