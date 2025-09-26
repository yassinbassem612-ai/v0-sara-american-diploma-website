-- Add target_users column to recorded_sessions table for user-specific targeting
ALTER TABLE recorded_sessions 
ADD COLUMN target_users TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN recorded_sessions.target_users IS 'Array of user IDs who can access this video. NULL means use category/level filtering.';
