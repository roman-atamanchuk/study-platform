import { apiFetch } from './client'
import type { MaterialBoard } from './materials'

export interface CourseDetail {
  id: number
  programmeId: number
  programmeName: string
  programmeCode: string
  semesterNumber: number
  name: string
  code: string | null
  iconUrl: string | null
  description: string | null
  status: 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'
  publicMaterialCount: number
  totalMaterialCount: number
}

export function fetchCourse(courseId: number): Promise<CourseDetail> {
  return apiFetch<CourseDetail>(`/courses/${courseId}`)
}

export function fetchPublicMaterialBoard(courseId: number): Promise<MaterialBoard> {
  return apiFetch<MaterialBoard>(`/courses/${courseId}/material-board`)
}
