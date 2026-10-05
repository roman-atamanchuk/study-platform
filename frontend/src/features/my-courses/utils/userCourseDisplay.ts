import type { UserCourse } from '../../../api/myCourses'

export function resolveUserCourseTitle(
  course: Pick<UserCourse, 'displayName' | 'courseName'>,
): string {
  const custom = course.displayName?.trim()
  return custom || course.courseName
}

export function formatOfficialCourseLabel(
  course: Pick<UserCourse, 'courseName' | 'courseCode' | 'semesterNumber'>,
): string {
  const parts = [course.courseName]
  if (course.courseCode) {
    parts.push(course.courseCode)
  }
  parts.push(`Semester ${course.semesterNumber}`)
  return parts.join(' · ')
}

export function shouldShowUserCourseParentHint(
  course: UserCourse,
  allCourses: UserCourse[],
): boolean {
  if (course.displayName?.trim()) {
    return true
  }
  return allCourses.filter((entry) => entry.courseId === course.courseId).length > 1
}
