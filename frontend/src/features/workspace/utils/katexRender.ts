import katex from 'katex'

export type LatexSegment =
  | { type: 'text'; content: string }
  | { type: 'math'; content: string; display: boolean }

/** Strip \( \), \[ \], $$ $$, $ $ delimiters (Witch-style). */
export function stripFormulaDelimiters(content: string): string {
  const trimmed = content.trim()
  const delimiterPairs: Array<[string, string]> = [
    ['\\(', '\\)'],
    ['\\[', '\\]'],
    ['$$', '$$'],
    ['$', '$'],
  ]

  for (const [start, end] of delimiterPairs) {
    if (trimmed.startsWith(start) && trimmed.endsWith(end) && trimmed.length > start.length + end.length) {
      return trimmed.slice(start.length, trimmed.length - end.length).trim()
    }
  }

  return trimmed
}

/** Fix common AI typo: ^(expr) → ^{(expr)} */
export function normalizeFormulaContent(content: string): string {
  return content.replace(/\^\(([^(){}]+)\)/g, '^{($1)}')
}

/** Strip optional $ / $$ delimiters from AI-provided LaTeX. */
export function normalizeLatexInput(input: string): string {
  return normalizeFormulaContent(stripFormulaDelimiters(input))
}

export function renderLatexToHtml(latex: string, displayMode = true): string {
  const normalized = normalizeLatexInput(latex)
  if (!normalized) {
    return ''
  }
  try {
    return katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: true,
    })
  } catch {
    return normalized
  }
}

/** Heuristic: AI sent LaTeX commands rather than plain text. */
export function looksLikeLatex(text: string): boolean {
  return (
    /\\(?:frac|sqrt|binom|sum|int|left|right|text|mu|sigma|alpha|beta|gamma|pi|theta|cdot|times|leq|geq|neq|pm)/.test(
      text,
    ) || /[\^_{}]/.test(text)
  )
}

function findEarliestMath(
  text: string,
  from: number,
): { index: number; length: number; content: string; display: boolean } | null {
  const slice = text.slice(from)
  let best: { index: number; length: number; content: string; display: boolean } | null = null

  const consider = (match: RegExpExecArray | null, display: boolean) => {
    if (!match) {
      return
    }
    const index = from + match.index
    if (!best || index < best.index) {
      best = {
        index,
        length: match[0].length,
        content: match[1].trim(),
        display,
      }
    }
  }

  consider(/\\\[([\s\S]*?)\\\]/.exec(slice), true)
  consider(/\\\(([\s\S]*?)\\\)/.exec(slice), false)
  consider(/\$\$([\s\S]*?)\$\$/.exec(slice), true)
  consider(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/.exec(slice), false)

  return best
}

/** Split prose + inline/display math like Witch formula rendering. */
export function splitLatexSegments(text: string): LatexSegment[] {
  if (!text) {
    return []
  }

  const segments: LatexSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const match = findEarliestMath(text, cursor)
    if (!match) {
      const tail = text.slice(cursor)
      if (tail) {
        segments.push({ type: 'text', content: tail })
      }
      break
    }

    if (match.index > cursor) {
      segments.push({ type: 'text', content: text.slice(cursor, match.index) })
    }

    if (match.content) {
      segments.push({ type: 'math', content: match.content, display: match.display })
    }

    cursor = match.index + match.length
  }

  if (segments.length === 0) {
    return [{ type: 'text', content: text }]
  }

  return segments
}

/** If the whole string is one formula, render display-mode KaTeX. */
export function isStandaloneFormula(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) {
    return false
  }
  const stripped = stripFormulaDelimiters(trimmed)
  return stripped !== trimmed || looksLikeLatex(stripped)
}
