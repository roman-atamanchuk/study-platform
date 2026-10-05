import { apiFetch } from './client'
import type { Material } from './materials'

export type AiModel = 'CHATGPT' | 'DEEPSEEK'

export interface AiMessage {
  id: number
  role: 'USER' | 'ASSISTANT'
  content: string
  visualsJson: string | null
  modelId: string | null
  cached: boolean
  createdAt: string
}

export interface AiChatResponse {
  threadId: number
  userMessage: AiMessage
  assistantMessage: AiMessage
  promptNormalized: string
  resolvedQuestion: string | null
  solutionMaterialTitle: string | null
}

export function fetchAiMessages(
  userCourseId: number,
  materialId: number,
  pageNumber: number,
): Promise<AiMessage[]> {
  const params = new URLSearchParams({
    materialId: String(materialId),
    pageNumber: String(pageNumber),
  })
  return apiFetch(`/my-courses/${userCourseId}/ai/messages?${params}`)
}

export function sendAiChat(
  userCourseId: number,
  body: {
    materialId: number
    pageNumber: number
    prompt: string
    model: AiModel
    rightMaterialId?: number | null
    rightPageNumber?: number | null
  },
): Promise<AiChatResponse> {
  return apiFetch(`/my-courses/${userCourseId}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function clearAiHistory(
  userCourseId: number,
  materialId: number,
  pageNumber: number,
): Promise<void> {
  const params = new URLSearchParams({
    materialId: String(materialId),
    pageNumber: String(pageNumber),
  })
  return apiFetch(`/my-courses/${userCourseId}/ai/history?${params}`, {
    method: 'DELETE',
  })
}

export function isSolutionMaterial(material: Material | null | undefined): boolean {
  return material?.materialType === 'SOLUTION'
}
