import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../../../api/auth'
import { ApiError } from '../../../types/api'
import { AuthLayout, AuthLink } from '../components/AuthLayout'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setResetUrl(null)
    setSubmitting(true)
    try {
      const response = await forgotPassword(email.trim())
      setMessage(response.message)
      if (response.resetUrl) {
        setResetUrl(response.resetUrl)
      } else if (response.resetToken) {
        setResetUrl(`/reset-password?token=${encodeURIComponent(response.resetToken)}`)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to start password reset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account email and we will start a password reset."
      footer={
        <>
          Remembered it? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        {error ? (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
            <p>{message}</p>
            {resetUrl ? (
              <button
                type="button"
                onClick={() => {
                  const path = resetUrl.startsWith('http')
                    ? new URL(resetUrl).pathname + new URL(resetUrl).search
                    : resetUrl
                  navigate(path)
                }}
                className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
              >
                Continue to reset password
              </button>
            ) : (
              <p className="text-xs text-emerald-200/80">
                In production this would arrive by email. For local/dev, enable expose-reset-token.
              </p>
            )}
          </div>
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
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  )
}
