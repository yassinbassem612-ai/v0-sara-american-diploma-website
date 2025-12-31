-- Add qr_code_data column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  closed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create attendance_scans table
CREATE TABLE IF NOT EXISTS attendance_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(session_id, user_id)
);

-- Generate QR codes using username instead of name
-- Generate QR codes for existing users
UPDATE users 
SET qr_code_data = 'STUDENT:' || id || ':' || username
WHERE qr_code_data IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_created_by ON attendance_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_active ON attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_scans_session_id ON attendance_scans(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scans_user_id ON attendance_scans(user_id);
