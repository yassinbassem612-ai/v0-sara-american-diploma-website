-- Add missing target_users column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS target_users UUID[];
