import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminDashboard, type AdminDashboard } from '../../../api/admin'
import { AdminSubNav } from '../components/AdminSubNav'

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminDashboard()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">Admin</h1>
      <AdminSubNav />

      <h2 className="mt-6 text-xl font-medium text-white">Dashboard</h2>
      <p className="mt-2 text-slate-400">
        Open Catalog to edit or delete programmes and courses. Each row has action buttons on the right.
      </p>

      {error ? <p className="mt-6 text-rose-300">{error}</p> : null}

      {stats ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Users', stats.userCount],
            ['Programmes', stats.programmeCount],
            ['Courses', stats.courseCount],
            ['Official materials', stats.officialMaterialCount],
            ['Active user courses', stats.activeUserCourseCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/admin/catalog"
          className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-sky-400"
        >
          Open catalog
        </Link>
        <Link
          to="/admin/catalog"
          state={{ tab: 'programmes' }}
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          Manage programmes
        </Link>
        <Link
          to="/admin/catalog"
          state={{ tab: 'courses' }}
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          Manage courses
        </Link>
      </div>
    </main>
  )
}
