CREATE TABLE AiAnswerCache (
    id                  BIGSERIAL PRIMARY KEY,
    cacheKey            VARCHAR(64) NOT NULL UNIQUE,
    courseId            BIGINT NOT NULL REFERENCES Course(id),
    materialId          BIGINT NOT NULL REFERENCES Material(id),
    pageNumber          INTEGER NOT NULL,
    modelId             VARCHAR(32) NOT NULL,
    promptNormalized    TEXT NOT NULL,
    answerBody          TEXT NOT NULL,
    hitCount            BIGINT NOT NULL DEFAULT 0,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_lookup ON AiAnswerCache(courseId, materialId, pageNumber, modelId);
CREATE INDEX idx_ai_cache_hits ON AiAnswerCache(courseId, materialId, pageNumber, hitCount DESC);

CREATE TABLE AiThread (
    id                  BIGSERIAL PRIMARY KEY,
    userCourseId        BIGINT NOT NULL REFERENCES UserCourse(id) ON DELETE CASCADE,
    materialId          BIGINT NOT NULL REFERENCES Material(id),
    pageNumber          INTEGER NOT NULL,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ai_thread_scope UNIQUE (userCourseId, materialId, pageNumber)
);

CREATE INDEX idx_ai_thread_usercourse ON AiThread(userCourseId, materialId, pageNumber);

CREATE TABLE AiMessage (
    id                  BIGSERIAL PRIMARY KEY,
    threadId            BIGINT NOT NULL REFERENCES AiThread(id) ON DELETE CASCADE,
    role                VARCHAR(16) NOT NULL,
    content             TEXT NOT NULL,
    modelId             VARCHAR(32),
    answerCacheId       BIGINT REFERENCES AiAnswerCache(id),
    cached              BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ai_message_role CHECK (role IN ('USER', 'ASSISTANT'))
);

CREATE INDEX idx_ai_message_thread ON AiMessage(threadId, createdAt ASC);
