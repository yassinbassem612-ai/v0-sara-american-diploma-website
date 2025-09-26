-- Fix RLS policies for attendance system
-- Allow admins to insert absence notifications and manage attendance records

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can insert absence notifications" ON absence_notifications;
DROP POLICY IF EXISTS "Admin can manage attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admin can manage attendance blocks" ON attendance_blocks;

-- Create policies for absence_notifications table
CREATE POLICY "Admin can insert absence notifications" ON absence_notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin can view absence notifications" ON absence_notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create policies for attendance_records table
CREATE POLICY "Admin can manage attendance records" ON attendance_records
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create policies for attendance_blocks table
CREATE POLICY "Admin can manage attendance blocks" ON attendance_blocks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Enable RLS on tables if not already enabled
ALTER TABLE absence_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_blocks ENABLE ROW LEVEL SECURITY;

-- Add unique constraint handling for attendance_records
-- This will help prevent duplicate key violations
CREATE OR REPLACE FUNCTION upsert_attendance_record(
  p_attendance_block_id UUID,
  p_student_id UUID,
  p_is_present BOOLEAN,
  p_marked_by_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  record_id UUID;
BEGIN
  -- Try to update existing record first
  UPDATE attendance_records 
  SET 
    is_present = p_is_present,
    marked_at = NOW(),
    marked_by_admin_id = p_marked_by_admin_id,
    updated_at = NOW()
  WHERE 
    attendance_block_id = p_attendance_block_id 
    AND student_id = p_student_id
  RETURNING id INTO record_id;
  
  -- If no record was updated, insert a new one
  IF record_id IS NULL THEN
    INSERT INTO attendance_records (
      attendance_block_id,
      student_id,
      is_present,
      marked_by_admin_id,
      marked_at,
      created_at,
      updated_at
    ) VALUES (
      p_attendance_block_id,
      p_student_id,
      p_is_present,
      p_marked_by_admin_id,
      NOW(),
      NOW(),
      NOW()
    ) RETURNING id INTO record_id;
  END IF;
  
  RETURN record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
