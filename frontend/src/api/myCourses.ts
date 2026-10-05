import { apiFetch } from './client'

export interface UserCourse {
  id: number
  courseId: number
  displayName: string | null
  courseName: string
  courseCode: string | null
  programmeName: string
  semesterNumber: number
  archived: boolean
  addedAt: string
  ownedByCurrentUser: boolean
}

export function fetchUserCourse(userCourseId: number): Promise<UserCourse> {
  return apiFetch(`/my-courses/${userCourseId}`)
}

export function fetchMyCourses(): Promise<UserCourse[]> {
  return apiFetch('/my-courses')
}

export function fetchArchivedCourses(): Promise<UserCourse[]> {
  return apiFetch('/my-courses/archived')
}

export function addCourseToLibrary(
  courseId: number,
  options?: { displayName?: string; createAnother?: boolean },
): Promise<UserCourse> {
  return apiFetch('/my-courses', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      displayName: options?.displayName,
      createAnother: options?.createAnother ?? false,
    }),
  })
}

export function updateUserCourseName(
  userCourseId: number,
  displayName: string,
): Promise<UserCourse> {
  return apiFetch(`/my-courses/${userCourseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  })
}

export function archiveCourse(userCourseId: number): Promise<UserCourse> {
  return apiFetch(`/my-courses/${userCourseId}/archive`, { method: 'POST' })
}

export function unarchiveCourse(userCourseId: number): Promise<UserCourse> {
  return apiFetch(`/my-courses/${userCourseId}/unarchive`, { method: 'POST' })
}
