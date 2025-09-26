-- Add level field to users table
ALTER TABLE users ADD COLUMN level character varying DEFAULT 'basics';

-- Add level field to recorded_sessions table  
ALTER TABLE recorded_sessions ADD COLUMN level character varying DEFAULT 'all';

-- Add level field to quizzes table
ALTER TABLE quizzes ADD COLUMN level character varying DEFAULT 'all';

-- Update existing users to have 'basics' level
UPDATE users SET level = 'basics' WHERE level IS NULL;

-- Update existing recorded_sessions to target 'all' levels
UPDATE recorded_sessions SET level = 'all' WHERE level IS NULL;

-- Update existing quizzes to target 'all' levels  
UPDATE quizzes SET level = 'all' WHERE level IS NULL;
