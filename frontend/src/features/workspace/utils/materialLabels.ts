import type { Material } from '../../../api/materials'
import { isImageMaterial, isPdfMaterial } from '../../../api/materials'

export function materialTypeLabel(material: Material | null | undefined): string {
  if (!material) return 'Empty'
  if (material.materialType === 'NOTE') return 'Note'
  if (material.videoId || material.materialType === 'VIDEO') return 'Video'
  if (isImageMaterial(material)) return 'Image'
  if (material.materialType === 'MY_MATERIAL') return 'My material'
  if (material.materialType === 'EXAM_PAPER') return 'Exam paper'
  if (material.materialType === 'SOLUTION') return 'Solution'
  if (material.materialType === 'LEARNING_MATERIAL') return 'Course material'
  if (isPdfMaterial(material)) return 'PDF'
  if (material.materialType === 'IMAGE') return 'Image'
  return 'Material'
}

/** Badge in material picker rows (Video, Image, PDF, Mine, Solution, …). */
export function materialPickerBadge(material: Material): string | null {
  if (!material.official) {
    if (material.materialType === 'NOTE') return 'Note'
    if (material.videoId || material.materialType === 'VIDEO') return 'Video'
    if (isImageMaterial(material)) return 'Image'
    if (isPdfMaterial(material)) return 'PDF'
    return 'Mine'
  }
  if (material.materialType === 'SOLUTION') return 'Solution'
  if (material.materialType === 'VIDEO' || material.videoId) return 'Video'
  if (material.materialType === 'IMAGE' || isImageMaterial(material)) return 'Image'
  return null
}

export const REVIEW_WORKSPACE_GUIDE_KEY = 'study-platform:review-workspace-guide-dismissed'
export const REVIEW_COURSE_GUIDE_KEY = 'study-platform:review-course-guide-dismissed'

export const REVIEW_WORKSPACE_GUIDE_TEXT =
  'Paper on the left, solution on the right works best · Swap mirrors zoom and width · ☆ pin favourites in the material picker · amber row = already on the other panel'

export const REVIEW_COURSE_GUIDE_TEXT =
  'Open an exam paper, then use Solution → or pick the linked marking scheme · Dual view compares side by side'

export const REVIEW_SHARED_GUIDE_TEXT =
  'Shared library — read-only · you see the owner’s materials and saved panel layout'

export const SHARE_RECIPIENT_NOTE =
  'You get their course library plus shared personal materials. Open the workspace to see the same left/right layout they had when sharing.'
