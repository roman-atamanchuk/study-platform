import { useEffect, useRef, useState } from 'react'
import type { Material } from '../../../api/materials'
import {
  clearAiHistory,
  fetchAiMessages,
  sendAiChat,
  type AiMessage,
  type AiModel,
} from '../../../api/ai'
import { AiAssistantContent } from './AiAssistantContent'

export function AiWorkspacePanel({
  userCourseId,
  sourceMaterial,
  sourcePage,
  rightMaterial,
  rightPage,
  courseCode,
  onChooseMaterial,
  onClose,
}: {
  userCourseId: number
  sourceMaterial: Material
  sourcePage: number
  rightMaterial?: Material | null
  rightPage?: number
  courseCode?: string | null
  onChooseMaterial: () => void
  onClose: () => void
}) {
  const [model, setModel] = useState<AiModel>('CHATGPT')
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [threadLoading, setThreadLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [resolvedQuestion, setResolvedQuestion] = useState<string | null>(null)
  const [solutionTitle, setSolutionTitle] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setThreadLoading(true)
    setMessages([])
    setPrompt('')
    setResolvedQuestion(null)
    setSolutionTitle(null)
    setError(null)

    void fetchAiMessages(userCourseId, sourceMaterial.id, sourcePage)
      .then((threadMessages) => {
        if (cancelled) return
        setMessages(threadMessages)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load AI history')
      })
      .finally(() => {
        if (!cancelled) {
          setThreadLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userCourseId, sourceMaterial.id, sourcePage])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function submitPrompt(text: string, selectedModel = model) {
    const trimmed = text.trim()
    if (!trimmed || loading || threadLoading) return
    setLoading(true)
    setError(null)
    try {
      const response = await sendAiChat(userCourseId, {
        materialId: sourceMaterial.id,
        pageNumber: sourcePage,
        prompt: trimmed,
        model: selectedModel,
        rightMaterialId:
          rightMaterial?.materialType === 'SOLUTION' ? rightMaterial.id : null,
        rightPageNumber:
          rightMaterial?.materialType === 'SOLUTION' ? (rightPage ?? sourcePage) : null,
      })
      setMessages((current) => [
        ...current,
        response.userMessage,
        response.assistantMessage,
      ])
      if (response.resolvedQuestion) {
        setResolvedQuestion(response.resolvedQuestion)
      }
      setSolutionTitle(response.solutionMaterialTitle)
      setPrompt('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleClearHistory() {
    setClearing(true)
    try {
      await clearAiHistory(userCourseId, sourceMaterial.id, sourcePage)
      setMessages([])
      setResolvedQuestion(null)
      setSolutionTitle(null)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to clear history')
    } finally {
      setClearing(false)
    }
  }

  function handleModelChange(nextModel: AiModel) {
    setModel(nextModel)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-black">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-800 bg-black px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-violet-300">Ask AI</span>
        <select
          value={model}
          onChange={(event) => handleModelChange(event.target.value as AiModel)}
          className="rounded-md border border-neutral-800 bg-black px-2 py-1 text-xs text-neutral-200"
        >
          <option value="DEEPSEEK">DeepSeek</option>
          <option value="CHATGPT">ChatGPT</option>
        </select>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
          {sourceMaterial.title} · page {sourcePage}
          {courseCode ? ` · ${courseCode}` : ''}
        </span>
        <button
          type="button"
          disabled={clearing || messages.length === 0}
          onClick={() => {
            void handleClearHistory()
          }}
          className="shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onChooseMaterial}
          className="shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-900"
        >
          Choose material
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-neutral-400 hover:bg-neutral-900 hover:text-white"
          title="Close AI"
          aria-label="Close AI"
        >
          ×
        </button>
      </div>

      <div className="shrink-0 space-y-1 border-b border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-500">
        <p>
          Source: {sourceMaterial.title} · page {sourcePage}
        </p>
        <p>
          Solution:{' '}
          {solutionTitle ??
            (rightMaterial?.materialType === 'SOLUTION'
              ? `${rightMaterial.title} · page ${rightPage ?? sourcePage}`
              : 'Auto-linked if available')}
        </p>
        {resolvedQuestion ? <p className="text-violet-300">Resolved: {resolvedQuestion}</p> : null}
      </div>

      <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-black px-3 py-3">
        {threadLoading ? (
          <p className="text-sm text-slate-500">Loading chat for page {sourcePage}…</p>
        ) : messages.length === 0 && !loading ? (
          <p className="text-sm text-slate-500">
            New chat for page {sourcePage}. Ask about the open source page — only this page is sent to the AI.
          </p>
        ) : null}

        <div className="min-w-0 space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`min-w-0 rounded-xl border px-3 py-2 text-sm ${
                message.role === 'USER'
                  ? 'border-sky-500/20 bg-sky-500/10 text-sky-50'
                  : 'border-neutral-800 bg-black text-neutral-100'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <span>{message.role === 'USER' ? 'You' : message.modelId ?? 'AI'}</span>
                {message.cached ? <span className="text-emerald-400">From library</span> : null}
              </div>
              {message.role === 'ASSISTANT' ? (
                <AiAssistantContent content={message.content} visualsJson={message.visualsJson} />
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )}
            </article>
          ))}
          {loading ? <p className="text-sm text-slate-400">Thinking…</p> : null}
        </div>
      </div>

      <form
        className="shrink-0 border-t border-neutral-800 bg-black p-3"
        onSubmit={(event) => {
          event.preventDefault()
          void submitPrompt(prompt)
        }}
      >
        {error ? <p className="mb-2 text-sm text-rose-300">{error}</p> : null}
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={2}
            placeholder={`Ask about page ${sourcePage}…`}
            disabled={threadLoading}
            className="min-h-[3rem] min-w-0 flex-1 resize-none rounded-lg border border-neutral-800 bg-black px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={loading || threadLoading || !prompt.trim()}
            className="self-end rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
