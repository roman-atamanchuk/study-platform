-- Local dev admin login (see README / DevLoginHint).

UPDATE "User"
SET email = 'romanatamanchuk5777@gmail.com',
    passwordhash = crypt('A5777qwe', gen_salt('bf')),
    updatedat = NOW()
WHERE role = 'ADMIN'
  AND email = 'admin@setu.ie';
