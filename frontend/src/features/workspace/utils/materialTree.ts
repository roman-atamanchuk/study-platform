import type { Material, MaterialBoard } from '../../../api/materials'

export interface ExamTreeNode {
  exam: Material
  children: Material[]
}

function childMaterials(board: MaterialBoard, examId: number): Material[] {
  const linked = [
    ...board.solutions,
    ...(board.myMaterials ?? []),
    ...board.videos.filter((material) => !material.official),
  ].filter((material) => material.parentExamMaterialId === examId)

  const seen = new Set<number>()
  return linked.filter((material) => {
    if (seen.has(material.id)) return false
    seen.add(material.id)
    return true
  })
}

export function buildExamTrees(board: MaterialBoard): ExamTreeNode[] {
  return board.examPapers.map((exam) => {
    let children = childMaterials(board, exam.id)

    if (children.length === 0) {
      children = board.solutions.filter(
        (solution) =>
          solution.parentExamMaterialId == null &&
          solution.year != null &&
          solution.year === exam.year,
      )
    }

    children.sort((a, b) => {
      if (a.official !== b.official) return a.official ? -1 : 1
      return a.title.localeCompare(b.title)
    })

    return { exam, children }
  })
}

/** Material ids shown under exam trees — excluded from course materials list. */
export function collectExamTreeMaterialIds(board: MaterialBoard): Set<number> {
  const ids = new Set<number>()
  for (const tree of buildExamTrees(board)) {
    ids.add(tree.exam.id)
    for (const child of tree.children) {
      ids.add(child.id)
    }
  }
  return ids
}

export function buildCourseWideMaterials(board: MaterialBoard): Material[] {
  const inExamTree = collectExamTreeMaterialIds(board)
  const personal = (board.myMaterials ?? []).filter(
    (material) => material.parentExamMaterialId == null && material.visibility !== 'PUBLIC',
  )
  const publicCatalog = (board.myMaterials ?? []).filter(
    (material) => material.parentExamMaterialId == null && material.visibility === 'PUBLIC',
  )
  return [
    ...board.learningMaterials,
    ...board.videos.filter(
      (material) =>
        material.official ||
        material.parentExamMaterialId == null ||
        material.visibility === 'PUBLIC',
    ),
    ...board.images.filter((material) => material.visibility === 'PUBLIC' || material.official),
    ...publicCatalog,
    ...personal,
    ...board.other.filter((material) => material.official || material.visibility === 'PUBLIC'),
  ].filter((material) => !inExamTree.has(material.id))
}

export function listOfficialExamPapers(board: MaterialBoard): Material[] {
  return board.examPapers
}

/**
 * Parent exam to attach new uploads to when adding from an open material.
 * Exam paper → itself; child → its parent exam; otherwise null.
 */
export function resolveRelatedExamMaterialId(
  material: Material,
  board: MaterialBoard,
): number | null {
  if (board.examPapers.some((exam) => exam.id === material.id)) {
    return material.id
  }
  if (material.parentExamMaterialId != null) {
    const parentExists = board.examPapers.some((exam) => exam.id === material.parentExamMaterialId)
    return parentExists ? material.parentExamMaterialId : null
  }
  for (const tree of buildExamTrees(board)) {
    if (tree.children.some((child) => child.id === material.id)) {
      return tree.exam.id
    }
  }
  return null
}

/** All non-official uploads (files, YouTube, etc.) for Mine filter and pins. */
export function collectPersonalMaterials(board: MaterialBoard): Material[] {
  const personal = [
    ...(board.myMaterials ?? []),
    ...board.videos.filter((material) => !material.official),
    ...board.images.filter((material) => !material.official),
    ...board.other.filter((material) => !material.official),
  ].filter((material) => material.visibility !== 'PUBLIC')
  const seen = new Set<number>()
  return personal.filter((material) => {
    if (seen.has(material.id)) return false
    seen.add(material.id)
    return true
  })
}
