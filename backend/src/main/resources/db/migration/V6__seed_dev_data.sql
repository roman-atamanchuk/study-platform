-- Dev seed data for local exploration (SETU Computer Science sample).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "User" (firstname, lastname, email, studentnumber, passwordhash, role, createdat, updatedat)
VALUES (
    'Platform',
    'Admin',
    'admin@setu.ie',
    '00000001',
    crypt('Password1', gen_salt('bf')),
    'ADMIN',
    NOW(),
    NOW()
);

INSERT INTO Programme (code, name, streamName, description, createdAt, updatedAt)
VALUES (
    'SE600',
    'BSc in Computing',
    'Computer Science',
    'Official SETU Computer Science programme library.',
    NOW(),
    NOW()
);

INSERT INTO Course (programmeId, semesterNumber, name, code, description, status, createdByAdminId, createdAt, updatedAt)
SELECT p.id, 1, 'Statistics & Probability', 'STAT101', 'Introduction to statistics and probability.', 'PUBLISHED', u.id, NOW(), NOW()
FROM Programme p, "User" u WHERE p.code = 'SE600' AND u.email = 'admin@setu.ie';

INSERT INTO Course (programmeId, semesterNumber, name, code, description, status, createdByAdminId, createdAt, updatedAt)
SELECT p.id, 1, 'Computer Networks', 'NET101', 'Fundamentals of computer networking.', 'PUBLISHED', u.id, NOW(), NOW()
FROM Programme p, "User" u WHERE p.code = 'SE600' AND u.email = 'admin@setu.ie';

INSERT INTO Course (programmeId, semesterNumber, name, code, description, status, createdByAdminId, createdAt, updatedAt)
SELECT p.id, 2, 'Databases', 'DB201', 'Relational database design and SQL.', 'PUBLISHED', u.id, NOW(), NOW()
FROM Programme p, "User" u WHERE p.code = 'SE600' AND u.email = 'admin@setu.ie';

INSERT INTO Course (programmeId, semesterNumber, name, code, description, status, createdByAdminId, createdAt, updatedAt)
SELECT p.id, 2, 'Software Engineering', 'SE201', 'Software development processes and practices.', 'PUBLISHED', u.id, NOW(), NOW()
FROM Programme p, "User" u WHERE p.code = 'SE600' AND u.email = 'admin@setu.ie';

INSERT INTO Course (programmeId, semesterNumber, name, code, description, status, createdByAdminId, createdAt, updatedAt)
SELECT p.id, 3, 'Web Development', 'WEB301', 'Modern web application development.', 'PUBLISHED', u.id, NOW(), NOW()
FROM Programme p, "User" u WHERE p.code = 'SE600' AND u.email = 'admin@setu.ie';
