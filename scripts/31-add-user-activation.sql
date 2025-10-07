-- Add is_active column to users table for account activation/deactivation
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Set all existing users to active by default
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- Create index for better performance when filtering by active status
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
