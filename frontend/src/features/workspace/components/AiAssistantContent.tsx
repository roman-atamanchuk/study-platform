import { AiMarkdownContent } from './AiMarkdownContent'
import { AiVisualsPanel } from './AiVisualsPanel'
import { parseAiVisuals, type AiVisualsPayload } from '../types/aiVisuals'
import type { ChartSpec } from '../types/chartTypes'

function tryParseBareChartContent(content: string): { markdown: string; visuals: AiVisualsPayload } | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') || !trimmed.includes('"type"')) {
    return null
  }
  try {
    const parsed = JSON.parse(trimmed) as ChartSpec & { visuals?: AiVisualsPayload }
    if (parsed.visuals) {
      return {
        markdown: parsed.title ? `## ${parsed.title}` : '## Chart',
        visuals: parsed.visuals,
      }
    }
    if (parsed.type && Array.isArray(parsed.datasets)) {
      return {
        markdown: parsed.title ? `## ${parsed.title}` : '## Chart',
        visuals: { charts: [parsed] },
      }
    }
  } catch {
    return null
  }
  return null
}

export function AiAssistantContent({
  content,
  visualsJson,
}: {
  content: string
  visualsJson?: string | null
}) {
  let markdown = content
  let visuals = parseAiVisuals(visualsJson)

  if (!visuals) {
    const recovered = tryParseBareChartContent(content)
    if (recovered) {
      markdown = recovered.markdown
      visuals = recovered.visuals
    }
  }

  return (
    <div className="min-w-0 max-w-full">
      {markdown.trim() ? <AiMarkdownContent content={markdown} /> : null}
      {visuals ? <AiVisualsPanel visuals={visuals} /> : null}
    </div>
  )
}
