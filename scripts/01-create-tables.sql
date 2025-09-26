-- Create users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
  category VARCHAR(10) CHECK (category IN ('act', 'sat', 'est') OR category IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create home_content table for admin-controlled homepage content
CREATE TABLE IF NOT EXISTS home_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20),
  center_location TEXT,
  free_session_link TEXT,
  about_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recorded_sessions table for video links
CREATE TABLE IF NOT EXISTS recorded_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  video_url TEXT NOT NULL,
  category VARCHAR(10) NOT NULL CHECK (category IN ('act', 'sat', 'est', 'all')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(10) NOT NULL CHECK (category IN ('act', 'sat', 'est')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'homework')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL, -- Store user answers as JSON
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id) -- Each user can only submit once per quiz
);

-- Create student_questions table
CREATE TABLE IF NOT EXISTS student_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (username: sara, password: 1980)
-- Note: In production, passwords should be properly hashed
INSERT INTO users (username, password_hash, role) 
VALUES ('sara', '$2b$10$rQZ8kHp0rQZ8kHp0rQZ8kOqZ8kHp0rQZ8kHp0rQZ8kHp0rQZ8kHp0r', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default home content
INSERT INTO home_content (phone_number, center_location, about_text, free_session_link)
VALUES (
  '01020176774',
  '123 Education Street, Learning City, LC 12345',
  'Welcome to Sara American Diploma - Your premier destination for SAT, ACT, and EST test preparation. We provide personalized tutoring and comprehensive study materials to help you achieve your academic goals.',
  'https://example.com/free-session'
)
ON CONFLICT DO NOTHING;
