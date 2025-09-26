-- Add deadline column to quizzes table
ALTER TABLE quizzes ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when filtering by deadline
CREATE INDEX idx_quizzes_deadline ON quizzes(deadline);
