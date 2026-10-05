import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { acceptShare, fetchSharePreview, type SharePreview } from '../../../api/sharing'
import { SHARE_RECIPIENT_NOTE } from '../../workspace/utils/materialLabels'
import { useAuthStore } from '../../../stores/authStore'
import { useAuthModalStore } from '../../../stores/authModalStore'

export function SharePreviewPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const status = useAuthStore((state) => state.status)
  const openLogin = useAuthModalStore((state) => state.openLogin)
  const [preview, setPreview] = useState<SharePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchSharePreview(token)
      .then(setPreview)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Share link not found')
      })
  }, [token])

  async function handleAccept() {
    if (!token) return
    if (status !== 'authenticated') {
      openLogin(`/share/${token}`)
      return
    }
    setAccepting(true)
    try {
      const result = await acceptShare(token)
      navigate(`/workspace/${result.userCourseId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to accept share')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Shared course</p>

      {error ? <p className="mt-6 text-rose-300">{error}</p> : null}

      {preview ? (
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {preview.courseCode ?? 'Course'}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{preview.courseName}</h1>
          {preview.courseDescription ? (
            <p className="mt-3 text-sm text-slate-400">{preview.courseDescription}</p>
          ) : null}
          <dl className="mt-6 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Shared by</dt>
              <dd className="text-white">{preview.ownerName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Materials included</dt>
              <dd className="text-white">{preview.materialCount}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{SHARE_RECIPIENT_NOTE}</p>

          {!preview.linkActive ? (
            <p className="mt-6 text-rose-300">This share link is no longer active.</p>
          ) : (
            <button
              type="button"
              disabled={accepting}
              onClick={() => void handleAccept()}
              className="mt-6 w-full rounded-lg bg-sky-500 py-2.5 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {accepting ? 'Adding to library...' : 'Add to My Courses'}
            </button>
          )}
        </section>
      ) : !error ? (
        <p className="mt-6 text-slate-400">Loading share preview...</p>
      ) : null}

      <Link to="/" className="mt-8 text-center text-sm text-sky-300 hover:text-sky-200">
        Back to home
      </Link>
    </main>
  )
}
