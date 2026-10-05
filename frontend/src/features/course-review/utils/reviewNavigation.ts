export function courseReviewMaterialUrl(courseId: number, materialId: number): string {
  const params = new URLSearchParams({
    mode: 'SINGLE',
    material: String(materialId),
  })
  return `/courses/${courseId}/review?${params.toString()}`
}
