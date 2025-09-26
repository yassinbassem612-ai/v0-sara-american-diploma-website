-- Add user targeting to quizzes table
ALTER TABLE quizzes ADD COLUMN target_users TEXT[];

-- Add comment for clarity
COMMENT ON COLUMN quizzes.target_users IS 'Array of user IDs who can access this quiz. NULL means available to all users in category/level.';
