ALTER TABLE Material DROP CONSTRAINT IF EXISTS chk_material_type;
ALTER TABLE Material ADD CONSTRAINT chk_material_type CHECK (
    materialType IN (
        'EXAM_PAPER',
        'SOLUTION',
        'LEARNING_MATERIAL',
        'IMAGE',
        'VIDEO',
        'OTHER',
        'MY_MATERIAL',
        'NOTE'
    )
);

ALTER TABLE Material
    ADD COLUMN IF NOT EXISTS htmlBody TEXT;
