import 'katex/dist/katex.min.css'
import { renderLatexToHtml, splitLatexSegments } from '../utils/katexRender'

const katexClass =
  '[&_.katex]:text-inherit [&_.katex-display]:my-1 [&_.katex-display]:overflow-x-auto'

export function AiMixedLatexText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const segments = splitLatexSegments(text)

  return (
    <span className={`whitespace-pre-wrap break-words ${katexClass} ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={`text-${index}`}>{segment.content}</span>
        }

        const html = renderLatexToHtml(segment.content, segment.display)
        if (!html) {
          return <span key={`math-${index}`}>{segment.content}</span>
        }

        return (
          <span
            key={`math-${index}`}
            className={segment.display ? 'block overflow-x-auto' : 'inline'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </span>
  )
}
