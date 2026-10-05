/** Normalize LaTeX delimiters from ChatGPT / DeepSeek into remark-math format. */
export function preprocessAiMarkdown(content: string): string {
  let result = content

  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr: string) => `$${expr.trim()}$`)

  return result
}
