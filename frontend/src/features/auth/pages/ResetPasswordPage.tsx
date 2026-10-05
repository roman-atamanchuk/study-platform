import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../../api/auth'
import { ApiError } from '../../../types/api'
import { AuthLayout, AuthLink } from '../components/AuthLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [token, setToken] = useState(tokenFromQuery)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (tokenFromQuery) {
      setToken(tokenFromQuery)
    }
  }, [tokenFromQuery])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token.trim()) {
      setError('Reset token is required')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token.trim(), password)
      setDone(true)
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account."
      footer={
        <>
          Back to <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      {done ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          Password updated. Redirecting to sign in…
        </p>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {error ? (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {!tokenFromQuery ? (
            <label className="block text-sm text-slate-300">
              Reset token
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label className="block text-sm text-slate-300">
            New password
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="mt-1 block text-xs text-slate-500">
              At least 8 characters, with upper, lower, and a number.
            </span>
          </label>

          <label className="block text-sm text-slate-300">
            Confirm password
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
