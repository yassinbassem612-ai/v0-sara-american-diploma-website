-- Create attendance blocks table for organizing attendance sessions
CREATE TABLE IF NOT EXISTS attendance_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  target_categories TEXT[],
  target_levels TEXT[],
  target_groups UUID[],
  target_users UUID[],
  created_by_admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create attendance records table to track student attendance for blocks
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_block_id UUID REFERENCES attendance_blocks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_present BOOLEAN DEFAULT false,
  marked_at TIMESTAMP WITH TIME ZONE,
  marked_by_admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attendance_block_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_blocks_active ON attendance_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_records_block ON attendance_records(attendance_block_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- Function to get students for an attendance block based on targeting
CREATE OR REPLACE FUNCTION get_attendance_block_students(input_block_id UUID)
RETURNS TABLE (
  student_id UUID,
  username VARCHAR,
  category VARCHAR,
  level VARCHAR,
  is_present BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as student_id,
    u.username,
    u.category,
    u.level,
    COALESCE(ar.is_present, false) as is_present
  FROM users u
  LEFT JOIN attendance_records ar ON ar.student_id = u.id AND ar.attendance_block_id = input_block_id
  LEFT JOIN group_memberships gm ON gm.user_id = u.id
  WHERE u.role = 'student'
  AND EXISTS (
    SELECT 1 FROM attendance_blocks ab
    WHERE ab.id = input_block_id
    AND ab.is_active = true
    AND (
      -- Target specific users
      (ab.target_users IS NOT NULL AND u.id = ANY(ab.target_users))
      OR
      -- Target by groups
      (ab.target_groups IS NOT NULL AND gm.group_id = ANY(ab.target_groups))
      OR
      -- Target by categories
      (ab.target_categories IS NOT NULL AND u.category = ANY(ab.target_categories))
      OR
      -- Target by levels
      (ab.target_levels IS NOT NULL AND u.level = ANY(ab.target_levels))
    )
  );
END;
$$ LANGUAGE plpgsql;
