import { useEffect, useState } from 'react'
import {
  fetchMaterialBlob,
  isImageMaterial,
  isPdfMaterial,
  materialDownloadUrl,
  type Material,
} from '../../../api/materials'
import { PdfViewer, type PdfFitMode } from './PdfViewer'

interface MaterialPreviewProps {
  material: Material
  page: number
  zoom: number
  fitMode: PdfFitMode
  fitRevision?: number
  viewportWidth?: number
  onPageChange: (page: number) => void
  onPageCountChange: (count: number) => void
}

export function MaterialPreview({
  material,
  page,
  zoom,
  fitMode,
  fitRevision = 0,
  viewportWidth = 0,
  onPageChange,
  onPageCountChange,
}: MaterialPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (material.videoId || material.materialType === 'NOTE') {
      setObjectUrl(null)
      setBlob(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    let currentUrl: string | null = null

    async function loadPreview() {
      setLoading(true)
      setError(null)
      setObjectUrl(null)
      setBlob(null)
      try {
        const loadedBlob = await fetchMaterialBlob(material.id)
        if (cancelled) return
        currentUrl = URL.createObjectURL(loadedBlob)
        setBlob(loadedBlob)
        setObjectUrl(currentUrl)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load preview')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [material.id, material.videoId, material.materialType])

  if (material.materialType === 'NOTE') {
    return (
      <div
        className="h-full overflow-auto bg-white px-6 py-5 text-base leading-relaxed text-slate-900"
        dangerouslySetInnerHTML={{ __html: material.htmlBody || '<p class="text-slate-400">Empty note</p>' }}
      />
    )
  }

  if (material.videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <iframe
          title={material.title}
          className="aspect-video w-full max-w-4xl rounded-lg"
          src={`https://www.youtube.com/embed/${material.videoId}`}
          allowFullScreen
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-400">Loading preview...</p>
      </div>
    )
  }

  if (error || !objectUrl || !blob) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium text-white">{material.title}</p>
          {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
          <p className="mt-2 text-xs text-slate-500">
            {material.originalFilename ?? 'File preview unavailable — file may be missing or not a valid PDF.'}
          </p>
          <a
            href={materialDownloadUrl(material.id)}
            className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Try download
          </a>
        </div>
      </div>
    )
  }

  if (isPdfMaterial(material)) {
    return (
      <div className="inline-block min-h-full min-w-min">
        <PdfViewer
          blob={blob}
          page={page}
          zoom={zoom}
          fitMode={fitMode}
          fitRevision={fitRevision}
          viewportWidth={viewportWidth}
          onPageChange={onPageChange}
          onPageCountChange={onPageCountChange}
        />
      </div>
    )
  }

  if (isImageMaterial(material)) {
    const zoomStyle = {
      transform: `scale(${zoom})`,
      transformOrigin: 'top center',
    } as const
    return (
      <div className="flex min-h-full w-full justify-center p-4">
        <img
          src={objectUrl}
          alt={material.title}
          style={zoomStyle}
          className="max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div>
        <p className="font-medium text-white">{material.title}</p>
        <a
          href={objectUrl}
          download={material.originalFilename ?? material.title}
          className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          Download file
        </a>
      </div>
    </div>
  )
}
