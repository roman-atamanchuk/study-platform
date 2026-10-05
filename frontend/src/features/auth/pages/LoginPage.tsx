import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, AuthLink } from '../components/AuthLayout'
import { DevLoginHint } from '../components/DevLoginHint'
import { useAuthStore } from '../../../stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const error = useAuthStore((state) => state.error)
  const fieldErrors = useAuthStore((state) => state.fieldErrors)
  const clearError = useAuthStore((state) => state.clearError)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate('/my-courses')
    } catch {
      // error stored in auth store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your SETU email to access your study library."
      footer={
        <>
          Need an account? <AuthLink to="/register">Register</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          {fieldErrors?.email ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.email}</span> : null}
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
            <AuthLink to="/forgot-password">Forgot password?</AuthLink>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
