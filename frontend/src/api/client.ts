import { ApiError, type ApiErrorResponse } from '../types/api'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function getApiBaseUrl(): string {
  return apiBaseUrl.replace(/\/$/, '')
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  if (!response.ok) {
    let payload: ApiErrorResponse | null = null
    try {
      payload = (await response.json()) as ApiErrorResponse
    } catch {
      payload = {
        code: 'REQUEST_FAILED',
        message: `Request failed: ${response.status} ${response.statusText}`,
      }
    }
    throw new ApiError(payload)
  }

  const text = await response.text()
  if (!text.trim()) {
    return undefined as T
  }

  return JSON.parse(text) as T
}
