import type { Material, MaterialBoard } from '../../../api/materials'

export function defaultExamSolutionPair(board: MaterialBoard): {
  leftMaterialId: number | null
  rightMaterialId: number | null
} {
  const latestExam = board.examPapers[0] ?? null
  if (!latestExam) {
    return { leftMaterialId: null, rightMaterialId: null }
  }

  const matchingSolution =
    board.solutions.find((solution) => solution.parentExamMaterialId === latestExam.id) ??
    board.solutions.find((solution) => solution.year != null && solution.year === latestExam.year) ??
    board.solutions[0] ??
    null

  return {
    leftMaterialId: latestExam.id,
    rightMaterialId: matchingSolution?.id ?? null,
  }
}

export function findMaterial(board: MaterialBoard, materialId: number | null): Material | null {
  if (materialId == null) return null
  const all = [
    ...board.examPapers,
    ...board.solutions,
    ...board.learningMaterials,
    ...board.images,
    ...board.videos,
    ...board.other,
    ...(board.myMaterials ?? []),
  ]
  return all.find((material) => material.id === materialId) ?? null
}

export function findLinkedSolution(board: MaterialBoard, exam: Material): Material | null {
  const linked =
    board.solutions.find((solution) => solution.parentExamMaterialId === exam.id) ??
    board.solutions.find(
      (solution) =>
        solution.parentExamMaterialId == null &&
        solution.year != null &&
        solution.year === exam.year,
    )
  return linked ?? null
}
