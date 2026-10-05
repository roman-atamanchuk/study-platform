import { useEffect, useState } from 'react'

export interface ReviewGuideConfig {
  text: string
  storageKey: string
  previewNote?: string
}

export function ReviewGuideBar({ guide }: { guide: ReviewGuideConfig | null | undefined }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!guide) {
      setDismissed(true)
      return
    }
    setDismissed(localStorage.getItem(guide.storageKey) === '1')
  }, [guide])

  if (!guide || dismissed) return null

  function dismiss() {
    localStorage.setItem(guide!.storageKey, '1')
    setDismissed(true)
  }

  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
      <div className="min-w-0 space-y-1">
        {guide.previewNote ? (
          <p className="font-medium text-amber-200/90">{guide.previewNote}</p>
        ) : null}
        <p className="leading-relaxed text-sky-50/95">{guide.text}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md border border-sky-500/30 px-2 py-1 text-[11px] text-sky-200 hover:bg-sky-500/20"
        aria-label="Dismiss guide"
      >
        Got it
      </button>
    </div>
  )
}

export function MaterialPaletteLegend() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
        This panel
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-2 w-2 rounded-full border border-amber-500/50 bg-amber-500/20" />
        Other panel
      </span>
      <span>☆ pin</span>
      <span className="text-emerald-500/80">Mine = your upload</span>
    </p>
  )
}
