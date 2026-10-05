import 'katex/dist/katex.min.css'
import { looksLikeLatex, renderLatexToHtml } from '../utils/katexRender'

export function AiLatexBlock({
  latex,
  displayMode = true,
  className = '',
}: {
  latex: string
  displayMode?: boolean
  className?: string
}) {
  const trimmed = latex.trim()
  if (!trimmed) {
    return null
  }

  if (looksLikeLatex(trimmed)) {
    const html = renderLatexToHtml(trimmed, displayMode)
    return (
      <div
        className={`overflow-x-auto text-slate-100 [&_.katex-display]:my-0 [&_.katex]:text-slate-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return <p className={`text-sm text-cyan-100 ${className}`}>{trimmed}</p>
}
