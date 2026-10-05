ALTER TABLE Material DROP CONSTRAINT IF EXISTS chk_material_type;
ALTER TABLE Material ADD CONSTRAINT chk_material_type CHECK (
    materialType IN ('EXAM_PAPER', 'SOLUTION', 'LEARNING_MATERIAL', 'IMAGE', 'VIDEO', 'OTHER', 'MY_MATERIAL')
);

ALTER TABLE Material
    ADD COLUMN parentExamMaterialId BIGINT REFERENCES Material(id);

CREATE INDEX idx_material_parent_exam ON Material(parentExamMaterialId);

UPDATE Material sol
SET parentExamMaterialId = exam.id
FROM Material exam
WHERE sol.materialType = 'SOLUTION'
  AND sol.isOfficial = TRUE
  AND sol.parentExamMaterialId IS NULL
  AND exam.materialType = 'EXAM_PAPER'
  AND exam.isOfficial = TRUE
  AND sol.courseId = exam.courseId
  AND sol.year IS NOT NULL
  AND exam.year = sol.year;
