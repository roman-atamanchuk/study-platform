-- Phase 1: User authentication tables.

CREATE TABLE "User" (
    id                      BIGSERIAL PRIMARY KEY,
    firstName               VARCHAR(100) NOT NULL,
    lastName                VARCHAR(100) NOT NULL,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    studentNumber           VARCHAR(32) NOT NULL UNIQUE,
    passwordHash            VARCHAR(255) NOT NULL,
    role                    VARCHAR(20) NOT NULL DEFAULT 'USER',
    programmeId             BIGINT,
    currentSemesterNumber   INTEGER,
    createdAt               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lastLoginAt             TIMESTAMPTZ,
    lastActiveAt            TIMESTAMPTZ,
    CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'))
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_student_number ON "User"(studentNumber);

CREATE TABLE PasswordResetToken (
    id                  BIGSERIAL PRIMARY KEY,
    userId              BIGINT NOT NULL REFERENCES "User"(id),
    tokenHash           VARCHAR(64) NOT NULL,
    expiresAt           TIMESTAMPTZ NOT NULL,
    usedAt              TIMESTAMPTZ,
    createdAt           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_passwordresettoken_user ON PasswordResetToken(userId);
CREATE INDEX idx_passwordresettoken_hash ON PasswordResetToken(tokenHash);
