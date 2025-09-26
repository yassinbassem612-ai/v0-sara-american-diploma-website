-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_memberships table for many-to-many relationship
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Add target_groups column to existing tables
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS target_groups UUID[];
ALTER TABLE recorded_sessions ADD COLUMN IF NOT EXISTS target_groups UUID[];
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS target_groups UUID[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_target_groups ON quizzes USING GIN(target_groups);
CREATE INDEX IF NOT EXISTS idx_recorded_sessions_target_groups ON recorded_sessions USING GIN(target_groups);
CREATE INDEX IF NOT EXISTS idx_sessions_target_groups ON sessions USING GIN(target_groups);
