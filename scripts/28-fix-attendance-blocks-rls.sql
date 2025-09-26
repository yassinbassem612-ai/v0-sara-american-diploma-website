-- Fix RLS policies for attendance_blocks table to allow admin access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "attendance_blocks_select_policy" ON attendance_blocks;
DROP POLICY IF EXISTS "attendance_blocks_insert_policy" ON attendance_blocks;
DROP POLICY IF EXISTS "attendance_blocks_update_policy" ON attendance_blocks;
DROP POLICY IF EXISTS "attendance_blocks_delete_policy" ON attendance_blocks;

-- Enable RLS on attendance_blocks table
ALTER TABLE attendance_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies that allow admin users to manage attendance blocks
CREATE POLICY "attendance_blocks_select_policy" ON attendance_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_blocks_insert_policy" ON attendance_blocks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_blocks_update_policy" ON attendance_blocks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_blocks_delete_policy" ON attendance_blocks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Also fix RLS policies for attendance_records table
DROP POLICY IF EXISTS "attendance_records_select_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_insert_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_update_policy" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_delete_policy" ON attendance_records;

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records_select_policy" ON attendance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_records_insert_policy" ON attendance_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_records_update_policy" ON attendance_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "attendance_records_delete_policy" ON attendance_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fix RLS policies for absence_notifications table
DROP POLICY IF EXISTS "absence_notifications_select_policy" ON absence_notifications;
DROP POLICY IF EXISTS "absence_notifications_insert_policy" ON absence_notifications;
DROP POLICY IF EXISTS "absence_notifications_update_policy" ON absence_notifications;

ALTER TABLE absence_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "absence_notifications_select_policy" ON absence_notifications
    FOR SELECT USING (
        -- Parents can see their own notifications
        parent_id = auth.uid()
        OR
        -- Admins can see all notifications
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "absence_notifications_insert_policy" ON absence_notifications
    FOR INSERT WITH CHECK (
        -- Only admins can create notifications
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "absence_notifications_update_policy" ON absence_notifications
    FOR UPDATE USING (
        -- Parents can update their own notifications (mark as read)
        parent_id = auth.uid()
        OR
        -- Admins can update all notifications
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
