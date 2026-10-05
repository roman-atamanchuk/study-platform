import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import { AiChartBlock } from './AiChartBlock'
import { AiMermaidBlock } from './AiMermaidBlock'
import { preprocessAiMarkdown } from '../utils/preprocessAiMarkdown'

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-lg font-semibold text-violet-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-base font-semibold text-violet-200">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-violet-300">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
  hr: () => <hr className="my-4 border-slate-700" />,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-violet-500/50 bg-violet-500/5 py-1 pl-3 text-slate-200">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-violet-500/30 shadow-sm shadow-violet-950/30">
      <table className="w-full min-w-[280px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gradient-to-r from-violet-600/35 to-cyan-600/25 text-violet-50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-slate-700/70">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="transition-colors even:bg-neutral-950/80 odd:bg-black hover:bg-neutral-900/80">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="border-b border-violet-500/35 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top text-slate-200">{children}</td>,
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className ?? '')
    const language = match?.[1]
    const text = String(children).replace(/\n$/, '')

    if (language === 'chart') {
      return <AiChartBlock spec={text} />
    }
    if (language === 'mermaid') {
      return <AiMermaidBlock code={text} />
    }

    if (!className) {
      return (
        <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-[0.85em] text-violet-200">{children}</code>
      )
    }

    return (
      <pre className="my-2 overflow-x-auto rounded-lg border border-neutral-800 bg-black p-3">
        <code className="text-xs leading-relaxed text-slate-200">{text}</code>
      </pre>
    )
  },
}

export function AiMarkdownContent({ content }: { content: string }) {
  const normalized = preprocessAiMarkdown(content)

  return (
    <div className="ai-markdown max-w-none text-sm leading-relaxed text-slate-100 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex]:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore', trust: true }]]}
        components={markdownComponents}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  )
}
