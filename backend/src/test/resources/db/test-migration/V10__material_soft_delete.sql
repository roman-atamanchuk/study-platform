ALTER TABLE Material
    ADD COLUMN deletedAt TIMESTAMPTZ;

CREATE INDEX idx_material_usercourse_deleted ON Material(userCourseId, deletedAt);
