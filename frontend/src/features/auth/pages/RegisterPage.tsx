import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProgrammes, type ProgrammeSummary } from '../../../api/publicLibrary'
import { AuthLayout, AuthLink } from '../components/AuthLayout'
import { useAuthStore } from '../../../stores/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((state) => state.signUp)
  const error = useAuthStore((state) => state.error)
  const fieldErrors = useAuthStore((state) => state.fieldErrors)
  const clearError = useAuthStore((state) => state.clearError)
  const [programmes, setProgrammes] = useState<ProgrammeSummary[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [password, setPassword] = useState('')
  const [programmeId, setProgrammeId] = useState<number | ''>('')
  const [currentSemesterNumber, setCurrentSemesterNumber] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProgrammes().then(setProgrammes).catch(() => undefined)
  }, [])

  const selectedProgramme = programmes.find((programme) => programme.id === programmeId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await signUp({
        firstName,
        lastName,
        email,
        studentNumber,
        password,
        programmeId: programmeId === '' ? undefined : programmeId,
        currentSemesterNumber,
      })
      navigate('/my-courses')
    } catch {
      // error stored in auth store
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName =
    'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-sky-400 focus:ring'

  return (
    <AuthLayout
      title="Create account"
      subtitle="Register with your SETU email and choose your programme."
      footer={
        <>
          Already registered? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            First name
            <input className={inputClassName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            {fieldErrors?.firstName ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.firstName}</span> : null}
          </label>
          <label className="block text-sm text-slate-300">
            Last name
            <input className={inputClassName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            {fieldErrors?.lastName ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.lastName}</span> : null}
          </label>
        </div>

        <label className="block text-sm text-slate-300">
          SETU email
          <input
            className={inputClassName}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {fieldErrors?.email ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.email}</span> : null}
        </label>

        <label className="block text-sm text-slate-300">
          Student number
          <input
            className={inputClassName}
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            required
          />
          {fieldErrors?.studentNumber ? (
            <span className="mt-1 block text-xs text-rose-300">{fieldErrors.studentNumber}</span>
          ) : null}
        </label>

        <label className="block text-sm text-slate-300">
          Password
          <input
            className={inputClassName}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {fieldErrors?.password ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.password}</span> : null}
        </label>

        <label className="block text-sm text-slate-300">
          Programme
          <select
            className={inputClassName}
            value={programmeId}
            onChange={(e) => setProgrammeId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Select programme</option>
            {programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </select>
        </label>

        {selectedProgramme?.streamName ? (
          <p className="text-sm text-slate-400">Stream: {selectedProgramme.streamName}</p>
        ) : null}

        <label className="block text-sm text-slate-300">
          Current semester
          <input
            className={inputClassName}
            type="number"
            min={1}
            max={8}
            value={currentSemesterNumber}
            onChange={(e) => setCurrentSemesterNumber(Number(e.target.value))}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}
