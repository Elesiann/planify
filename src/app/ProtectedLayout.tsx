import { useEffect } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { RequireAuth, useAuth } from '@/lib/auth'
import { useHousehold } from '@/lib/HouseholdProvider'

const getActiveTab = (pathname: string): 'resumo' | 'logs' | 'fixos' => {
  if (!pathname) return 'resumo'
  if (pathname === '/logs' || pathname.startsWith('/logs/')) return 'logs'
  if (pathname === '/fixed' || pathname.startsWith('/fixed/')) return 'fixos'
  return 'resumo'
}

const getPageTitle = (pathname: string): string => {
  if (!pathname || pathname === '/') return 'Planify | Resumo'
  if (pathname === '/logs' || pathname.startsWith('/logs/')) return 'Planify | Logs'
  if (pathname === '/fixed' || pathname.startsWith('/fixed/')) return 'Planify | Fixos'
  if (pathname === '/profile') return 'Planify | Perfil'
  if (pathname === '/households') return 'Planify | Households'
  if (pathname.startsWith('/tools/')) return 'Planify | Ferramentas'
  return 'Planify'
}

const RequireHousehold = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const { households, isLoading, isInitialized } = useHousehold()
  const navigate = useNavigate()

  useEffect(() => {
    // Wait for auth to complete before processing returnTo
    if (authLoading) return
    // Check if there's a returnTo URL (e.g., from invite flow)
    const returnTo = localStorage.getItem('returnTo')
    if (returnTo) {
      localStorage.removeItem('returnTo')
      // Validate returnTo is a safe internal path
      if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        navigate({ to: returnTo })
        return
      }
    }

    // Only redirect to onboarding if user is authenticated AND has no households
    if (!authLoading && user && isInitialized && !isLoading && households.length === 0) {
      navigate({ to: '/onboarding' })
    }
  }, [authLoading, user, isInitialized, isLoading, households.length, navigate])

  // Wait for auth to complete first
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  // If no user, RequireAuth will handle the redirect to /login
  if (!user) {
    return null
  }

  // Wait for household data
  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (households.length === 0) {
    return null // Will redirect to onboarding
  }

  return <>{children}</>
}

export const ProtectedLayout = () => {
  const { location } = useRouterState()
  const pathname = location.pathname ?? '/'
  const activeTab = getActiveTab(pathname)

  useEffect(() => {
    document.title = getPageTitle(pathname)
  }, [pathname])

  return (
    <RequireAuth>
      <RequireHousehold>
        <AppShell activeTab={activeTab}>
          <Outlet />
        </AppShell>
      </RequireHousehold>
    </RequireAuth>
  )
}


