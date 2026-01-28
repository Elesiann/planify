import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { ProtectedLayout } from './ProtectedLayout'
import DashboardPage from '../routes'
import FixedPage from '../routes/fixed'
import LogsPage from '../routes/logs'
import LoginPage from '../routes/login'
import ProfilePage from '../routes/profile'
import OnboardingPage from '../routes/onboarding'
import InvitePage from '../routes/invite/$token'
import ImportLogsTool from '../routes/tools/import-logs'
import HouseholdsPage from '../routes/households'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invite/$token',
  component: InvitePage,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
})

const logsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/logs',
  component: LogsPage,
})

const fixedRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/fixed',
  component: FixedPage,
})

const importLogsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/tools/import-logs',
  component: ImportLogsTool,
})

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/profile',
  component: ProfilePage,
})

const householdsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/households',
  component: HouseholdsPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  onboardingRoute,
  inviteRoute,
  protectedRoute.addChildren([dashboardRoute, logsRoute, fixedRoute, importLogsRoute, profileRoute, householdsRoute]),
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


