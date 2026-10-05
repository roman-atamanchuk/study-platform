import { apiFetch } from './client'

export interface ShareLink {
  id: number
  token: string
  label: string | null
  createdAt: string
  expiresAt: string | null
  active: boolean
  shareUrl: string
}

export interface SharePreview {
  courseName: string
  courseCode: string | null
  courseDescription: string | null
  courseIconUrl: string | null
  ownerName: string
  materialCount: number
  linkActive: boolean
}

export interface SharedCourse {
  sharedAccessId: number
  userCourseId: number
  courseId: number
  courseName: string
  courseCode: string | null
  ownerName: string
  sharedAt: string
}

export interface AcceptShareResult {
  userCourseId: number
  sharedAccessId: number
}

export function fetchSharePreview(token: string): Promise<SharePreview> {
  return apiFetch(`/share-links/${token}`)
}

export function acceptShare(token: string): Promise<AcceptShareResult> {
  return apiFetch(`/share-links/${token}/accept`, { method: 'POST' })
}

export function createShareLink(userCourseId: number, label?: string): Promise<ShareLink> {
  return apiFetch(`/my-courses/${userCourseId}/share-links`, {
    method: 'POST',
    body: JSON.stringify({ label: label ?? null }),
  })
}

export function fetchShareLinks(userCourseId: number): Promise<ShareLink[]> {
  return apiFetch(`/my-courses/${userCourseId}/share-links`)
}

export function revokeShareLink(shareLinkId: number): Promise<ShareLink> {
  return apiFetch(`/share-links/${shareLinkId}/revoke`, { method: 'POST' })
}

export function fetchSharedCourses(): Promise<SharedCourse[]> {
  return apiFetch('/shared-courses')
}
