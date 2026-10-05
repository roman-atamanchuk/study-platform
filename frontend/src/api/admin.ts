import { apiFetch } from './client'
import type { Material, MaterialType, MaterialVisibility } from './materials'
import type { ProgrammeSummary } from './publicLibrary'

export interface CourseDetailResponse {
  id: number
  programmeId: number
  programmeName: string
  programmeCode: string
  semesterNumber: number
  name: string
  code: string | null
  iconUrl: string | null
  description: string | null
  status: string
  publicMaterialCount: number
  totalMaterialCount: number
}

export interface AdminDashboard {
  userCount: number
  programmeCount: number
  courseCount: number
  officialMaterialCount: number
  activeUserCourseCount: number
}

export function fetchAdminDashboard(): Promise<AdminDashboard> {
  return apiFetch('/admin/dashboard')
}

export function fetchAdminProgrammes(): Promise<ProgrammeSummary[]> {
  return apiFetch('/admin/programmes')
}

export function fetchAdminCourses(): Promise<CourseDetailResponse[]> {
  return apiFetch('/admin/courses')
}

export function createProgramme(body: {
  code: string
  name: string
  streamName?: string
  description?: string
}): Promise<ProgrammeSummary> {
  return apiFetch('/admin/programmes', { method: 'POST', body: JSON.stringify(body) })
}

export function updateProgramme(
  programmeId: number,
  body: {
    name?: string
    streamName?: string | null
    description?: string | null
  },
): Promise<ProgrammeSummary> {
  return apiFetch(`/admin/programmes/${programmeId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteProgramme(programmeId: number): Promise<void> {
  return apiFetch(`/admin/programmes/${programmeId}`, { method: 'DELETE' })
}

export function createCourse(body: {
  programmeId: number
  semesterNumber: number
  name: string
  code?: string
  description?: string
}): Promise<CourseDetailResponse> {
  return apiFetch('/admin/courses', { method: 'POST', body: JSON.stringify(body) })
}

export function updateCourse(
  courseId: number,
  body: {
    programmeId?: number
    semesterNumber?: number
    name?: string
    code?: string | null
    description?: string | null
    status?: 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'
  },
): Promise<CourseDetailResponse> {
  return apiFetch(`/admin/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteCourse(courseId: number): Promise<void> {
  return apiFetch(`/admin/courses/${courseId}`, { method: 'DELETE' })
}

export function uploadOfficialMaterial(
  courseId: number,
  file: File,
  title: string | undefined,
  materialType: MaterialType,
  visibility: MaterialVisibility = 'PUBLIC',
  year?: number,
  parentExamMaterialId?: number | null,
): Promise<Material> {
  const formData = new FormData()
  formData.append('file', file)
  if (title?.trim()) formData.append('title', title.trim())
  formData.append('materialType', materialType)
  formData.append('visibility', visibility)
  if (year != null) formData.append('year', String(year))
  if (parentExamMaterialId != null) formData.append('parentExamMaterialId', String(parentExamMaterialId))
  return fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/admin/courses/${courseId}/materials`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(payload.message ?? 'Upload failed')
    }
    return response.json() as Promise<Material>
  })
}

export function addOfficialVideo(
  courseId: number,
  body: {
    title: string
    videoId: string
    visibility?: MaterialVisibility
    description?: string
    year?: number
  },
): Promise<Material> {
  return apiFetch(`/admin/courses/${courseId}/materials/video`, {
    method: 'POST',
    body: JSON.stringify({
      title: body.title,
      videoId: body.videoId,
      visibility: body.visibility ?? 'PUBLIC',
      description: body.description,
      year: body.year,
      thumbnailUrl: `https://img.youtube.com/vi/${body.videoId}/hqdefault.jpg`,
    }),
  })
}

export function fetchAdminCourseMaterials(courseId: number): Promise<Material[]> {
  return apiFetch(`/admin/courses/${courseId}/materials`)
}

export function deleteOfficialMaterial(materialId: number): Promise<void> {
  return apiFetch(`/admin/materials/${materialId}`, { method: 'DELETE' })
}

export function updateOfficialMaterialVisibility(
  materialId: number,
  visibility: MaterialVisibility,
): Promise<Material> {
  return apiFetch(`/admin/materials/${materialId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  })
}
