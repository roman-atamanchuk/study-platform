const YEAR_PATTERN = /\b(19|20)\d{2}\b/g

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'])

const OFFICE_EXTENSIONS = new Set([
  'doc',
  'docx',
  'dot',
  'dotx',
  'odt',
  'ott',
  'rtf',
  'txt',
  'xls',
  'xlsx',
  'xlt',
  'xltx',
  'ods',
  'ots',
  'csv',
  'ppt',
  'pptx',
  'pot',
  'potx',
  'odp',
  'otp',
  'odg',
])

function extensionOf(filename: string): string | null {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) return null
  return filename.slice(dot + 1).toLowerCase()
}

export function isImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = extensionOf(file.name)
  return ext != null && IMAGE_EXTENSIONS.has(ext)
}

export function isPdfFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (file.type === 'application/pdf') return true
  return extensionOf(file.name) === 'pdf'
}

export function isConvertibleOfficeFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (isPdfFile(file) || isImageFile(file)) return false
  const ext = extensionOf(file.name)
  if (ext != null && OFFICE_EXTENSIONS.has(ext)) return true
  const mime = file.type.toLowerCase()
  return (
    mime.includes('wordprocessingml') ||
    mime.includes('spreadsheetml') ||
    mime.includes('presentationml') ||
    mime.includes('msword') ||
    mime.includes('ms-excel') ||
    mime.includes('ms-powerpoint') ||
    mime.includes('opendocument') ||
    mime === 'text/plain' ||
    mime === 'text/rtf' ||
    mime === 'application/rtf' ||
    mime === 'text/csv'
  )
}

/** Short label shown next to a picked file in the upload dialog. */
export function fileUploadKindLabel(file: Pick<File, 'name' | 'type'>): string {
  if (isImageFile(file)) return 'Image'
  if (isPdfFile(file)) return 'PDF'
  if (isConvertibleOfficeFile(file)) return 'Converts to PDF'
  const ext = extensionOf(file.name)
  return ext ? ext.toUpperCase() : 'File'
}

export function extractYearFromFilename(filename: string): number | undefined {
  const stem = filename.replace(/\.[^.]+$/, '')
  const matches = stem.match(YEAR_PATTERN)
  if (!matches) return undefined
  for (const match of matches) {
    const year = Number(match)
    if (year >= 1990 && year <= 2100) return year
  }
  return undefined
}

export function titleFromFilename(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

export function mergeFiles(existing: File[], incoming: File[]): File[] {
  const key = (file: File) => `${file.name}:${file.size}:${file.lastModified}`
  const merged = new Map(existing.map((file) => [key(file), file]))
  for (const file of incoming) {
    merged.set(key(file), file)
  }
  return [...merged.values()]
}
