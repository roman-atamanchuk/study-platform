import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)

  if (!user) {
    return null
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Welcome, {user.firstName} {user.lastName}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>

      <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-medium text-white">Quick links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/my-courses"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            My Courses
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Public Library
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-medium text-white">Your profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="font-medium text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Student number</dt>
            <dd className="font-medium text-white">{user.studentNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Role</dt>
            <dd className="font-medium text-emerald-300">{user.role}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Current semester</dt>
            <dd className="font-medium text-white">{user.currentSemesterNumber ?? 'Not set'}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
