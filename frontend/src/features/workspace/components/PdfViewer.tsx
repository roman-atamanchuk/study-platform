import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

export type PdfFitMode = 'width' | 'custom'

interface PdfViewerProps {
  blob: Blob
  page: number
  zoom: number
  fitMode: PdfFitMode
  fitRevision?: number
  viewportWidth?: number
  onPageChange: (page: number) => void
  onPageCountChange: (count: number) => void
}

function isRenderCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  return name === 'RenderingCancelledException' || name === 'AbortException'
}

const RENDER_DEBOUNCE_MS = 100
const MAX_RENDER_RETRIES = 3

export function PdfViewer({
  blob,
  page,
  zoom,
  fitMode,
  fitRevision = 0,
  viewportWidth = 0,
  onPageChange,
  onPageCountChange,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null)
  const renderSeqRef = useRef(0)
  const paintTimerRef = useRef<number | null>(null)

  const [docReady, setDocReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [containerWidth, setContainerWidth] = useState(0)

  const cancelActiveRender = useCallback(() => {
    renderTaskRef.current?.cancel()
    renderTaskRef.current = null
  }, [])

  const clearPaintTimer = useCallback(() => {
    if (paintTimerRef.current != null) {
      window.clearTimeout(paintTimerRef.current)
      paintTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      setContainerWidth(container.clientWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    setDocReady(false)
    setLoadError(null)
    setRenderError(null)
    cancelActiveRender()
    clearPaintTimer()

    void (async () => {
      try {
        const previous = pdfRef.current
        pdfRef.current = null
        previous?.destroy()

        const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise
        if (cancelled) {
          await pdf.destroy()
          return
        }

        pdfRef.current = pdf
        setPageCount(pdf.numPages)
        onPageCountChange(pdf.numPages)
        setDocReady(true)
      } catch {
        if (!cancelled) {
          setLoadError('Unable to render PDF')
        }
      }
    })()

    return () => {
      cancelled = true
      clearPaintTimer()
      cancelActiveRender()
      renderSeqRef.current += 1
      pdfRef.current?.destroy()
      pdfRef.current = null
    }
  }, [blob, onPageCountChange, cancelActiveRender, clearPaintTimer])

  useEffect(() => {
    if (!docReady) return

    const paint = async (attempt = 0) => {
      const seq = ++renderSeqRef.current
      const pdf = pdfRef.current
      const canvas = canvasRef.current
      if (!pdf || !canvas) return

      const measuredWidth = viewportWidth > 0 ? viewportWidth : containerWidth
      const availableWidth = measuredWidth - 32
      if (availableWidth <= 0) {
        if (attempt < MAX_RENDER_RETRIES) {
          window.setTimeout(() => void paint(attempt + 1), 120)
        }
        return
      }

      setRenderError(null)
      cancelActiveRender()

      try {
        const safePage = Math.min(Math.max(page, 1), pdf.numPages)
        const pdfPage = await pdf.getPage(safePage)
        if (seq !== renderSeqRef.current) return

        const baseViewport = pdfPage.getViewport({ scale: 1 })
        const fitScale = Math.max(availableWidth / baseViewport.width, 0.5)
        const scale =
          fitMode === 'width'
            ? fitScale
            : Math.max(fitScale * zoom, 0.5)

        const viewport = pdfPage.getViewport({ scale })
        const context = canvas.getContext('2d')
        if (!context || seq !== renderSeqRef.current) return

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        canvas.style.maxWidth = 'none'
        canvas.style.maxHeight = 'none'

        const task = pdfPage.render({ canvasContext: context, viewport })
        renderTaskRef.current = task
        await task.promise

        if (seq !== renderSeqRef.current) return
        renderTaskRef.current = null
      } catch (error) {
        if (seq !== renderSeqRef.current || isRenderCancelled(error)) return
        if (attempt < MAX_RENDER_RETRIES - 1) {
          window.setTimeout(() => void paint(attempt + 1), 150)
          return
        }
        setRenderError('Unable to render page')
      }
    }

    clearPaintTimer()
    paintTimerRef.current = window.setTimeout(() => {
      paintTimerRef.current = null
      void paint(0)
    }, RENDER_DEBOUNCE_MS)

    return () => {
      clearPaintTimer()
      cancelActiveRender()
    }
  }, [
    docReady,
    page,
    zoom,
    fitMode,
    fitRevision,
    viewportWidth,
    containerWidth,
    cancelActiveRender,
    clearPaintTimer,
  ])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && page > 1) {
        event.preventDefault()
        onPageChange(page - 1)
      }
      if (event.key === 'ArrowRight' && page < pageCount) {
        event.preventDefault()
        onPageChange(page + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPageChange, page, pageCount])

  const showLoading = !docReady && !loadError

  return (
    <div ref={containerRef} className="relative inline-flex min-h-full min-w-min justify-center p-4">
      {showLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
          <p className="text-sm text-slate-400">Loading PDF...</p>
        </div>
      ) : null}
      {loadError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950 p-4">
          <p className="text-sm text-rose-300">{loadError}</p>
        </div>
      ) : null}
      {renderError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/85 p-4">
          <p className="text-sm text-rose-300">{renderError}</p>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="rounded-lg bg-white shadow-lg" />
    </div>
  )
}
