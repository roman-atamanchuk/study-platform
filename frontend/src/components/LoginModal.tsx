import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAuthModalStore } from '../stores/authModalStore'
import { DevLoginHint } from '../features/auth/components/DevLoginHint'

export function LoginModal() {
  const navigate = useNavigate()
  const open = useAuthModalStore((state) => state.open)
  const redirectPath = useAuthModalStore((state) => state.redirectPath)
  const closeLogin = useAuthModalStore((state) => state.closeLogin)
  const authStatus = useAuthStore((state) => state.status)
  const signIn = useAuthStore((state) => state.signIn)
  const error = useAuthStore((state) => state.error)
  const fieldErrors = useAuthStore((state) => state.fieldErrors)
  const clearError = useAuthStore((state) => state.clearError)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open || authStatus === 'authenticated') return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await signIn({ email, password })
      closeLogin()
      if (redirectPath) {
        navigate(redirectPath)
      }
    } catch {
      // error stored in auth store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="login-modal-title" className="text-xl font-semibold text-white">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-400">Use your SETU email to continue.</p>
          </div>
          <button
            type="button"
            onClick={closeLogin}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <DevLoginHint />
          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <label className="block text-sm text-slate-300">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {fieldErrors?.email ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="block text-sm text-slate-300">
            Password
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            {fieldErrors?.password ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.password}</span>
            ) : null}
            <span className="mt-2 block text-right text-xs">
              <Link
                to="/forgot-password"
                onClick={closeLogin}
                className="text-sky-300 hover:text-sky-200"
              >
                Forgot password?
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Need an account?{' '}
          <Link to="/register" onClick={closeLogin} className="text-sky-300 hover:text-sky-200">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
