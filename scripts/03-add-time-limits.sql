-- Add time_limit_minutes column to quizzes table
ALTER TABLE quizzes ADD COLUMN time_limit_minutes INTEGER DEFAULT 0;

-- Update existing quizzes to have no time limit (0 means unlimited)
UPDATE quizzes SET time_limit_minutes = 0 WHERE time_limit_minutes IS NULL;
