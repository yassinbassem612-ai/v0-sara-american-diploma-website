-- ========================================================
-- Migration 33: Drop Unneeded Tables & Update Quizzes Schema
-- ========================================================

-- 1. Drop unused tables and their foreign keys (CASCADE)
-- Dropping Parent Management tables
DROP TABLE IF EXISTS parent_messages CASCADE;
DROP TABLE IF EXISTS parent_children CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

-- Dropping Session schedule & Video Links
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS recorded_sessions CASCADE;

-- Dropping Sheets system
DROP TABLE IF EXISTS sheets CASCADE;

-- Dropping Students Arrivals tables (attendance blocks & old records)
-- (Note: attendance_sessions & attendance_scans for QR Attendance are preserved!)
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_blocks CASCADE;
DROP TABLE IF EXISTS absence_notifications CASCADE;

-- Dropping Student Questions & Parent Questions
DROP TABLE IF EXISTS student_questions CASCADE;

-- Dropping Certificates & Weekly Reports
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS weekly_reports CASCADE;

-- 2. Drop functions and triggers related to dropped tables
DROP FUNCTION IF EXISTS user_can_access_sheet CASCADE;
DROP FUNCTION IF EXISTS get_user_accessible_sheets CASCADE;
DROP FUNCTION IF EXISTS get_sheet_stats CASCADE;
DROP FUNCTION IF EXISTS validate_sheet_targeting CASCADE;
DROP FUNCTION IF EXISTS validate_sheet_before_save CASCADE;
DROP FUNCTION IF EXISTS get_attendance_block_students CASCADE;
DROP FUNCTION IF EXISTS upsert_attendance_record CASCADE;

-- 3. Add note / tag column to quizzes table so admin can label exams (e.g. "Classwork", "Homework")
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS tag TEXT;

-- 4. Update quiz_questions table to support EST 5th choice (choice_e) and flexible choices
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS choice_e TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS options JSONB;

-- Drop strict check constraint on correct_answer to allow 'e' or any choice letter
ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_correct_answer_check;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_correct_answer_check CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e', 'f', 'g'));
