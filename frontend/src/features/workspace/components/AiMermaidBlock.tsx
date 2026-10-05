import { useEffect, useId, useState } from 'react'

let mermaidReady: Promise<typeof import('mermaid')> | null = null

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then((module) => {
      module.default.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        themeVariables: {
          primaryColor: '#7c3aed',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#a78bfa',
          lineColor: '#94a3b8',
          secondaryColor: '#0e7490',
          tertiaryColor: '#1e293b',
          background: '#0f172a',
          mainBkg: '#1e293b',
          nodeBorder: '#8b5cf6',
          clusterBkg: '#1e293b',
          titleColor: '#e2e8f0',
          edgeLabelBackground: '#0f172a',
        },
      })
      return module
    })
  }
  return mermaidReady
}

export function AiMermaidBlock({ code }: { code: string }) {
  const reactId = useId()
  const chartId = `ai-mermaid-${reactId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void loadMermaid()
      .then(async (module) => {
        const mermaid = module.default
        try {
          const { svg: rendered } = await mermaid.render(chartId, code.trim())
          if (!cancelled) {
            setSvg(rendered)
            setError(null)
          }
        } catch (err: unknown) {
          if (!cancelled) {
            setSvg(null)
            setError(err instanceof Error ? err.message : 'Could not render diagram')
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Mermaid failed to load')
        }
      })

    return () => {
      cancelled = true
    }
  }, [chartId, code])

  if (error) {
    return (
      <pre className="my-2 overflow-x-auto rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
        {code}
      </pre>
    )
  }

  if (!svg) {
    return <p className="my-2 text-xs text-slate-500">Rendering diagram…</p>
  }

  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-cyan-500/25 bg-black p-3 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
