-- Custom SQL migration file, put your code below! --
UPDATE message
SET role = 'user'
WHERE role = 'USER';

UPDATE message
SET role = 'assistant'
WHERE role = 'AGENT';

UPDATE message
SET role = 'system'
WHERE role = 'SYSTEM';
