CREATE TABLE UserCourseHiddenMaterial (
    id              BIGSERIAL PRIMARY KEY,
    userCourseId    BIGINT NOT NULL REFERENCES UserCourse(id) ON DELETE CASCADE,
    materialId      BIGINT NOT NULL REFERENCES Material(id) ON DELETE CASCADE,
    hiddenAt        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usercourse_hidden_material UNIQUE (userCourseId, materialId)
);

CREATE INDEX idx_hidden_material_usercourse ON UserCourseHiddenMaterial(userCourseId, hiddenAt DESC);
