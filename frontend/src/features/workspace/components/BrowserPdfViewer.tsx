import { useEffect, useState } from 'react'
import { fetchMaterialBlob, materialViewUrl, type Material } from '../../../api/materials'

interface BrowserPdfViewerProps {
  material: Material
  page?: number
}

export function BrowserPdfViewer({ material, page = 1 }: BrowserPdfViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let currentUrl: string | null = null

    async function load() {
      setLoading(true)
      setError(null)
      setObjectUrl(null)
      try {
        const blob = await fetchMaterialBlob(material.id)
        if (cancelled) return
        currentUrl = URL.createObjectURL(blob)
        setObjectUrl(currentUrl)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load PDF')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [material.id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading PDF for text selection…</p>
      </div>
    )
  }

  if (error || !objectUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-rose-300">{error ?? 'Unable to load PDF'}</p>
        <a
          href={materialViewUrl(material.id)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-500/30"
        >
          Open in new tab
        </a>
      </div>
    )
  }

  const pdfSrc = page > 1 ? `${objectUrl}#page=${page}` : objectUrl

  return (
    <iframe
      key={`${material.id}-${page}`}
      title={`${material.title} — copy text`}
      src={pdfSrc}
      className="h-full w-full border-0 bg-slate-900"
    />
  )
}
