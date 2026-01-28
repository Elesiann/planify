import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'

const LoginPage = () => {
  const router = useRouter()
  const { signInWithGoogle, user, loading, error } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a returnTo URL (e.g., from invite page)
      const returnTo = localStorage.getItem('returnTo')
      if (returnTo) {
        localStorage.removeItem('returnTo')
        // Validate that returnTo is a safe internal path
        if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          router.navigate({ to: returnTo })
        } else {
          console.warn('Invalid returnTo URL, redirecting to home')
          router.navigate({ to: '/' })
        }
      } else {
        router.navigate({ to: '/' })
      }
    }
  }, [loading, user, router])

  const handleLogin = async () => {
    try {
      setSubmitting(true)
      await signInWithGoogle()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-400">Planify</p>
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use sua conta Google autorizada para acessar.
          </p>
        </div>
        <button
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          type="button"
          onClick={handleLogin}
          disabled={submitting || loading}
        >
          {submitting ? 'Redirecionando...' : 'Entrar com Google'}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}

export default LoginPage
