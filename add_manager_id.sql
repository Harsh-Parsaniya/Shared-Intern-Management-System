-- Run this once in Hasura Console -> Data -> SQL
-- Adds manager_id column to departments table

ALTER TABLE departments
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
