-- Phase 3-5: User library, materials, workspace, and sharing tables.

CREATE TABLE UserCourse (
    id                  BIGSERIAL PRIMARY KEY,
    userId              BIGINT NOT NULL REFERENCES "User"(id),
    courseId            BIGINT NOT NULL REFERENCES Course(id),
    sourceUserCourseId  BIGINT REFERENCES UserCourse(id),
    addedAt             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    isArchived          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_usercourse_user_course ON UserCourse(userId, courseId);
CREATE INDEX idx_usercourse_archived ON UserCourse(isArchived);

CREATE TABLE StoredFile (
    id                  BIGSERIAL PRIMARY KEY,
    sha256Hash          VARCHAR(64) NOT NULL UNIQUE,
    storageUrl          TEXT NOT NULL,
    originalFilename    VARCHAR(512) NOT NULL,
    mimeType            VARCHAR(128) NOT NULL,
    fileSize            BIGINT NOT NULL,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storedfile_hash ON StoredFile(sha256Hash);

CREATE TABLE Material (
    id                  BIGSERIAL PRIMARY KEY,
    courseId            BIGINT NOT NULL REFERENCES Course(id),
    userCourseId        BIGINT REFERENCES UserCourse(id),
    uploadedByUserId    BIGINT REFERENCES "User"(id),
    storedFileId        BIGINT REFERENCES StoredFile(id),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    materialType        VARCHAR(30) NOT NULL,
    "year"              INTEGER,
    visibility          VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    displayOrder        INTEGER,
    isOfficial          BOOLEAN NOT NULL DEFAULT FALSE,
    externalUrl         TEXT,
    videoId             VARCHAR(128),
    thumbnailUrl          TEXT,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_material_visibility CHECK (visibility IN ('PUBLIC', 'SHARED', 'PRIVATE')),
    CONSTRAINT chk_material_type CHECK (materialType IN ('EXAM_PAPER', 'SOLUTION', 'LEARNING_MATERIAL', 'IMAGE', 'VIDEO', 'OTHER'))
);

CREATE INDEX idx_material_course_visibility ON Material(courseId, visibility, displayOrder);
CREATE INDEX idx_material_usercourse ON Material(userCourseId);
CREATE INDEX idx_material_type ON Material(materialType);

CREATE TABLE ShareInviteLink (
    id                  BIGSERIAL PRIMARY KEY,
    userCourseId        BIGINT NOT NULL REFERENCES UserCourse(id),
    token               VARCHAR(64) NOT NULL UNIQUE,
    label               VARCHAR(128),
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiresAt           TIMESTAMPTZ,
    revokedAt           TIMESTAMPTZ
);

CREATE INDEX idx_shareinvitelink_token ON ShareInviteLink(token);
CREATE INDEX idx_shareinvitelink_usercourse ON ShareInviteLink(userCourseId);

CREATE TABLE SharedCourseAccess (
    id                  BIGSERIAL PRIMARY KEY,
    userCourseId        BIGINT NOT NULL REFERENCES UserCourse(id),
    sharedWithUserId    BIGINT NOT NULL REFERENCES "User"(id),
    shareInviteLinkId   BIGINT REFERENCES ShareInviteLink(id),
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revokedAt           TIMESTAMPTZ
);

CREATE INDEX idx_sharedaccess_usercourse ON SharedCourseAccess(userCourseId);

CREATE TABLE WorkspaceState (
    id                  BIGSERIAL PRIMARY KEY,
    userId              BIGINT NOT NULL REFERENCES "User"(id),
    courseId            BIGINT NOT NULL REFERENCES Course(id),
    userCourseId        BIGINT REFERENCES UserCourse(id),
    leftMaterialId      BIGINT REFERENCES Material(id),
    rightMaterialId     BIGINT REFERENCES Material(id),
    leftPage            INTEGER,
    rightPage           INTEGER,
    leftScrollPosition  DOUBLE PRECISION,
    rightScrollPosition DOUBLE PRECISION,
    leftZoom            DOUBLE PRECISION,
    rightZoom           DOUBLE PRECISION,
    dividerPosition     DOUBLE PRECISION,
    activePanel         VARCHAR(10),
    viewMode            VARCHAR(10) NOT NULL DEFAULT 'DUAL',
    updatedAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_workspace_view_mode CHECK (viewMode IN ('SINGLE', 'DUAL')),
    CONSTRAINT chk_workspace_active_panel CHECK (activePanel IS NULL OR activePanel IN ('LEFT', 'RIGHT'))
);

CREATE UNIQUE INDEX idx_workspacestate_user_course ON WorkspaceState(userId, courseId, userCourseId);
