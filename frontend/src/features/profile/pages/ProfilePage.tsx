import { useEffect, useState } from 'react'
import { fetchProgrammes, type ProgrammeSummary } from '../../../api/publicLibrary'
import { changePassword, updateProfile } from '../../../api/profile'
import { useAuthStore } from '../../../stores/authStore'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const signOut = useAuthStore((state) => state.signOut)
  const [programmes, setProgrammes] = useState<ProgrammeSummary[]>([])
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [programmeId, setProgrammeId] = useState<number | ''>(user?.programmeId ?? '')
  const [semester, setSemester] = useState(user?.currentSemesterNumber ?? 1)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgrammes().then(setProgrammes).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setProgrammeId(user.programmeId ?? '')
    if (user.currentSemesterNumber) setSemester(user.currentSemesterNumber)
  }, [user])

  const selectedProgramme = programmes.find((programme) => programme.id === programmeId)

  async function handleProfileSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await updateProfile({
        firstName,
        lastName,
        programmeId: programmeId === '' ? undefined : programmeId,
        currentSemesterNumber: semester,
      })
      await bootstrap()
      setMessage('Profile updated.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function handlePasswordSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Password changed.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password change failed')
    }
  }

  if (!user) return null

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-slate-400">{user.email}</p>

      {message ? <p className="mt-4 text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-4 text-rose-300">{error}</p> : null}

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-medium text-white">Profile</h2>
        <form className="mt-4 space-y-3" onSubmit={(e) => void handleProfileSave(e)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              First name
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </label>
            <label className="block text-sm text-slate-300">
              Last name
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                required
              />
            </label>
          </div>
          <label className="block text-sm text-slate-300">
            Programme
            <select
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
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
              type="number"
              min={1}
              max={8}
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
          <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950">
            Update profile
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-medium text-white">Change password</h2>
        <form className="mt-4 space-y-3" onSubmit={(e) => void handlePasswordSave(e)}>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            required
          />
          <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950">
            Update password
          </button>
        </form>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
      >
        Logout
      </button>
    </main>
  )
}
