import { apiFetch } from './client'

export interface ProgrammeSummary {
  id: number
  code: string
  name: string
  streamName: string | null
  description: string | null
}

export interface CourseSummary {
  id: number
  programmeId: number
  semesterNumber: number
  name: string
  code: string | null
  iconUrl: string | null
  status: 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'
  publicMaterialCount?: number
}

export interface PublicLibraryResponse {
  programmes: ProgrammeSummary[]
  featuredCourses: CourseSummary[]
}

export interface ProgrammeDetail extends ProgrammeSummary {
  courses: CourseSummary[]
}

export function fetchPublicLibrary(): Promise<PublicLibraryResponse> {
  return apiFetch<PublicLibraryResponse>('/public-library')
}

export function fetchProgrammes(): Promise<ProgrammeSummary[]> {
  return apiFetch<ProgrammeSummary[]>('/programmes')
}

export function fetchProgramme(id: number): Promise<ProgrammeDetail> {
  return apiFetch<ProgrammeDetail>(`/programmes/${id}`)
}

export function searchCourses(query: string): Promise<CourseSummary[]> {
  return apiFetch<CourseSummary[]>(`/courses/search?q=${encodeURIComponent(query)}`)
}
