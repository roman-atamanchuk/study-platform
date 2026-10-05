/** Extract a YouTube video id from common URL formats or a bare 11-character id. */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v')
        return id && /^[\w-]{11}$/.test(id) ? id : null
      }
      const embedMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)
      if (embedMatch) return embedMatch[1]
    }
  } catch {
    return null
  }

  return null
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
