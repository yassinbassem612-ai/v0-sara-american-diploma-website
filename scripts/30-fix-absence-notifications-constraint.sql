-- Fix absence_notifications table to not require session_id for attendance-based notifications
-- Make session_id nullable and add attendance_block_id as an alternative reference

-- Add attendance_block_id column to absence_notifications
ALTER TABLE absence_notifications 
ADD COLUMN IF NOT EXISTS attendance_block_id uuid REFERENCES attendance_blocks(id);

-- Make session_id nullable since attendance-based notifications don't need it
ALTER TABLE absence_notifications 
ALTER COLUMN session_id DROP NOT NULL;

-- Add a check constraint to ensure either session_id or attendance_block_id is provided
ALTER TABLE absence_notifications 
ADD CONSTRAINT check_notification_reference 
CHECK (session_id IS NOT NULL OR attendance_block_id IS NOT NULL);

-- Update RLS policies for absence_notifications if they exist
DROP POLICY IF EXISTS "absence_notifications_policy" ON absence_notifications;

-- Create comprehensive RLS policy for absence_notifications
CREATE POLICY "absence_notifications_policy" ON absence_notifications
FOR ALL USING (
  -- Parents can see their own notifications
  auth.uid() = parent_id OR
  -- Admins can manage all notifications
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON absence_notifications TO authenticated;
