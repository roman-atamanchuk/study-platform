import { apiFetch, getApiBaseUrl } from './client'

export type MaterialType =
  | 'EXAM_PAPER'
  | 'SOLUTION'
  | 'LEARNING_MATERIAL'
  | 'IMAGE'
  | 'VIDEO'
  | 'OTHER'
  | 'MY_MATERIAL'
  | 'NOTE'

export type MaterialVisibility = 'PUBLIC' | 'SHARED' | 'PRIVATE'

export interface Material {
  id: number
  courseId: number
  userCourseId: number | null
  title: string
  description: string | null
  materialType: MaterialType
  year: number | null
  visibility: MaterialVisibility
  displayOrder: number | null
  official: boolean
  externalUrl: string | null
  videoId: string | null
  thumbnailUrl: string | null
  originalFilename: string | null
  mimeType: string | null
  fileSize: number | null
  pdfPreviewAvailable: boolean
  createdAt: string
  deletedAt: string | null
  parentExamMaterialId: number | null
  htmlBody?: string | null
}

export interface TrashMaterial extends Material {
  trashedAt: string
  canPermanentlyDelete: boolean
}

export interface MaterialBoard {
  examPapers: Material[]
  solutions: Material[]
  learningMaterials: Material[]
  images: Material[]
  videos: Material[]
  other: Material[]
  myMaterials: Material[]
}

export function fetchMaterials(userCourseId: number): Promise<Material[]> {
  return apiFetch(`/my-courses/${userCourseId}/materials`)
}

export function fetchMaterialBoard(userCourseId: number): Promise<MaterialBoard> {
  return apiFetch(`/my-courses/${userCourseId}/material-board`)
}

export function uploadMaterial(
  userCourseId: number,
  file: File,
  title: string | undefined,
  visibility: MaterialVisibility = 'SHARED',
  parentExamMaterialId?: number | null,
): Promise<Material> {
  const formData = new FormData()
  formData.append('file', file)
  if (title?.trim()) formData.append('title', title.trim())
  formData.append('visibility', visibility)
  if (parentExamMaterialId != null) {
    formData.append('parentExamMaterialId', String(parentExamMaterialId))
  }

  return fetch(`${getApiBaseUrl()}/my-courses/${userCourseId}/materials/upload`, {
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

export function addVideoMaterial(
  userCourseId: number,
  body: {
    title: string
    videoId: string
    visibility?: MaterialVisibility
    parentExamMaterialId?: number | null
    description?: string
    year?: number
  },
): Promise<Material> {
  return apiFetch(`/my-courses/${userCourseId}/materials/video`, {
    method: 'POST',
    body: JSON.stringify({
      title: body.title,
      videoId: body.videoId,
      visibility: body.visibility ?? 'SHARED',
      parentExamMaterialId: body.parentExamMaterialId ?? null,
      description: body.description,
      year: body.year,
      thumbnailUrl: `https://img.youtube.com/vi/${body.videoId}/hqdefault.jpg`,
    }),
  })
}

export function addNoteMaterial(
  userCourseId: number,
  body: {
    title: string
    htmlBody?: string
    visibility?: MaterialVisibility
    parentExamMaterialId: number
  },
): Promise<Material> {
  return apiFetch(`/my-courses/${userCourseId}/materials/note`, {
    method: 'POST',
    body: JSON.stringify({
      title: body.title,
      htmlBody: body.htmlBody ?? '',
      visibility: body.visibility ?? 'SHARED',
      parentExamMaterialId: body.parentExamMaterialId,
    }),
  })
}

export function updateMaterial(
  materialId: number,
  body: {
    title?: string
    description?: string
    year?: number
    htmlBody?: string
  },
): Promise<Material> {
  return apiFetch(`/materials/${materialId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteMaterial(materialId: number): Promise<void> {
  return apiFetch(`/materials/${materialId}`, { method: 'DELETE' })
}

export function hideOfficialMaterial(userCourseId: number, materialId: number): Promise<void> {
  return apiFetch(`/my-courses/${userCourseId}/hidden-materials/${materialId}`, { method: 'POST' })
}

export function fetchTrashMaterials(userCourseId: number): Promise<TrashMaterial[]> {
  return apiFetch(`/my-courses/${userCourseId}/materials/trash`).then((items) =>
    (items as Array<{ material: Material; trashedAt: string; canPermanentlyDelete: boolean }>).map(
      (item) => ({
        ...item.material,
        deletedAt: item.trashedAt,
        trashedAt: item.trashedAt,
        canPermanentlyDelete: item.canPermanentlyDelete,
      }),
    ),
  )
}

export function clearTrashMaterials(userCourseId: number): Promise<void> {
  return apiFetch(`/my-courses/${userCourseId}/materials/trash`, { method: 'DELETE' })
}

export function restoreMaterial(userCourseId: number, materialId: number): Promise<Material> {
  return apiFetch(`/materials/${materialId}/restore?userCourseId=${userCourseId}`, { method: 'POST' })
}

export function permanentlyDeleteMaterial(materialId: number): Promise<void> {
  return apiFetch(`/materials/${materialId}/permanent`, { method: 'DELETE' })
}

export function updateMaterialVisibility(
  materialId: number,
  visibility: MaterialVisibility,
): Promise<Material> {
  return apiFetch(`/materials/${materialId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  })
}

export function materialDownloadUrl(materialId: number): string {
  return `${getApiBaseUrl()}/materials/${materialId}/download`
}

export function materialViewUrl(materialId: number): string {
  return `${getApiBaseUrl()}/materials/${materialId}/view`
}

export async function fetchMaterialBlob(materialId: number): Promise<Blob> {
  const response = await fetch(materialViewUrl(materialId), { credentials: 'include' })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Failed to load material preview' }))
      throw new Error(payload.message ?? 'Failed to load material preview')
    }
  return response.blob()
}

export function isPdfMaterial(material: Material): boolean {
  if (material.pdfPreviewAvailable) return true
  if (material.mimeType === 'application/pdf') return true
  return material.originalFilename?.toLowerCase().endsWith('.pdf') ?? false
}

export function isImageMaterial(material: Material): boolean {
  if (material.mimeType?.startsWith('image/')) return true
  const name = material.originalFilename?.toLowerCase() ?? ''
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
}

export function canDeletePersonalMaterial(
  material: Material | null | undefined,
  readOnly?: boolean,
  workspaceUserCourseId?: number | null,
): boolean {
  if (readOnly || !material || material.official) return false
  if (workspaceUserCourseId != null) {
    return material.userCourseId === workspaceUserCourseId
  }
  return material.userCourseId != null
}

export function canRemoveMaterialToTrash(
  material: Material | null | undefined,
  readOnly?: boolean,
  workspaceUserCourseId?: number | null,
): boolean {
  if (readOnly || !material) return false
  if (material.official) return true
  return canDeletePersonalMaterial(material, readOnly, workspaceUserCourseId)
}

export function flattenMaterialBoard(board: MaterialBoard): Material[] {
  return [
    ...board.examPapers,
    ...board.solutions,
    ...board.learningMaterials,
    ...board.images,
    ...board.videos,
    ...board.other,
    ...(board.myMaterials ?? []),
  ]
}
