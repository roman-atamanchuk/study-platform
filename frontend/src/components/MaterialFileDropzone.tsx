import { useRef, useState } from 'react'
import { extractYearFromFilename, fileUploadKindLabel, mergeFiles } from '../utils/materialFileMetadata'

interface MaterialFileDropzoneProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  multiple?: boolean
}

export function MaterialFileDropzone({
  files,
  onFilesChange,
  disabled = false,
  multiple = true,
}: MaterialFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function addFiles(incoming: FileList | File[]) {
    const list = [...incoming]
    if (!multiple) {
      onFilesChange(list.slice(0, 1))
      return
    }
    onFilesChange(mergeFiles(files, list))
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="sm:col-span-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (disabled || event.dataTransfer.files.length === 0) return
          addFiles(event.dataTransfer.files)
        }}
        className={
          dragOver
            ? 'rounded-xl border-2 border-dashed border-sky-400 bg-sky-500/10 px-4 py-8 text-center'
            : 'rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/50 px-4 py-8 text-center hover:border-slate-600'
        }
      >
        <p className="text-sm font-medium text-white">
          {multiple ? 'Drag and drop files here' : 'Drag and drop a file here'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          or click to browse{multiple ? ' — multiple files supported' : ''}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Images open in the viewer · Word, Excel, PowerPoint, and OpenDocument files convert to PDF
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const picked = event.target.files
          if (!picked || picked.length === 0) return
          addFiles(picked)
          event.target.value = ''
        }}
      />

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => {
            const year = extractYearFromFilename(file.name)
            const kindLabel = fileUploadKindLabel(file)
            return (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-slate-200">
                    {file.name}
                    <span className="text-slate-500"> · {kindLabel}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {year != null ? `Year detected: ${year}` : 'No year in filename'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation()
                    removeFile(index)
                  }}
                  className="shrink-0 text-xs text-rose-300 hover:text-rose-200 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
