import { useEffect, useRef, useState } from 'react'
import type { Material, MaterialVisibility } from '../../../api/materials'
import { MaterialVisibilitySelect } from '../../../components/MaterialVisibilitySelect'

export function NoteWorkspacePanel({
  parentExamTitle,
  initialTitle = '',
  initialHtml = '',
  initialVisibility = 'SHARED',
  allowPublic = false,
  saving = false,
  error = null,
  existingMaterial = null,
  embedded = false,
  onSave,
  onClose,
}: {
  parentExamTitle: string
  initialTitle?: string
  initialHtml?: string
  initialVisibility?: MaterialVisibility
  allowPublic?: boolean
  saving?: boolean
  error?: string | null
  existingMaterial?: Material | null
  /** When true, always edit mode inside a normal ViewerPanel (Save/Cancel only). */
  embedded?: boolean
  onSave: (payload: {
    title: string
    htmlBody: string
    visibility: MaterialVisibility
  }) => void
  onClose: () => void
}) {
  const isExisting = existingMaterial != null
  const [editing, setEditing] = useState(embedded || !isExisting)
  const [title, setTitle] = useState(initialTitle || 'Untitled note')
  const [visibility, setVisibility] = useState<MaterialVisibility>(initialVisibility)
  const [dirty, setDirty] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(initialTitle || 'Untitled note')
    setVisibility(initialVisibility)
    setEditing(embedded || !isExisting)
    setDirty(false)
    const editor = editorRef.current
    if (editor) {
      editor.innerHTML = initialHtml || ''
    }
  }, [existingMaterial?.id, initialTitle, initialHtml, initialVisibility, isExisting, embedded])

  function markDirty() {
    setDirty(true)
  }

  function insertImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const editor = editorRef.current
      if (!editor || typeof reader.result !== 'string') return
      editor.focus()
      const img = document.createElement('img')
      img.src = reader.result
      img.alt = file.name
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editor.appendChild(img)
      }
      markDirty()
    }
    reader.readAsDataURL(file)
  }

  function handleClose() {
    if ((editing && dirty) || saving) {
      const ok = window.confirm('Discard unsaved note changes?')
      if (!ok) return
    }
    onClose()
  }

  function handleSave() {
    const htmlBody = editorRef.current?.innerHTML ?? ''
    const trimmedTitle = title.trim() || 'Untitled note'
    onSave({ title: trimmedTitle, htmlBody, visibility })
    setDirty(false)
    if (isExisting && !embedded) {
      setEditing(false)
    }
  }

  function startEditing() {
    setEditing(true)
    setDirty(false)
    window.requestAnimationFrame(() => {
      editorRef.current?.focus()
    })
  }

  function cancelEditing() {
    if (dirty) {
      const ok = window.confirm('Discard unsaved note changes?')
      if (!ok) return
    }
    setTitle(initialTitle || 'Untitled note')
    setVisibility(initialVisibility)
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml || ''
    }
    setDirty(false)
    if (embedded) {
      onClose()
      return
    }
    setEditing(false)
  }

  const showEditChrome = editing

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-white text-slate-900">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Note</span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
          {title} · under {parentExamTitle}
        </span>
        {showEditChrome ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isExisting ? 'Save' : 'Save note'}
            </button>
            {isExisting || embedded ? (
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </button>
        )}
        {!embedded ? (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            title="Close note"
            aria-label="Close note"
          >
            ×
          </button>
        ) : null}
      </div>

      {showEditChrome ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <input
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              markDirty()
            }}
            placeholder="Note title"
            className="min-w-[12rem] flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
          />
          <MaterialVisibilitySelect
            value={visibility}
            onChange={(value) => {
              setVisibility(value)
              markDirty()
            }}
            context="personal"
            allowPublic={allowPublic}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            Insert image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) insertImage(file)
              event.target.value = ''
            }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="shrink-0 border-b border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div
        ref={editorRef}
        contentEditable={showEditChrome}
        suppressContentEditableWarning
        onInput={showEditChrome ? markDirty : undefined}
        className={`min-h-0 flex-1 overflow-auto px-6 py-5 text-base leading-relaxed outline-none ${
          showEditChrome ? '' : 'cursor-default'
        }`}
        style={{ caretColor: showEditChrome ? '#0f172a' : 'transparent' }}
        data-placeholder="Type or paste your notes here…"
      />
    </div>
  )
}
