-- Run this once in Hasura Console -> Data -> SQL
-- Adds a column to track who submitted each feedback (intern or department)

ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS submitted_by_role TEXT NOT NULL DEFAULT 'intern'
CHECK (submitted_by_role IN ('intern', 'department'));
