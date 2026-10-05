import { apiFetch } from './client'

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  programmeId?: number
  currentSemesterNumber?: number
}

export function updateProfile(request: UpdateProfileRequest): Promise<void> {
  return apiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify(request),
  }).then(() => undefined)
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch('/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(() => undefined)
}
