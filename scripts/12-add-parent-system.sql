-- Add parent account system tables

-- Add parent accounts table
CREATE TABLE IF NOT EXISTS parents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add parent-child relationships table
CREATE TABLE IF NOT EXISTS parent_children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- Add parent-admin messages table
CREATE TABLE IF NOT EXISTS parent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    admin_response TEXT,
    is_read_by_admin BOOLEAN DEFAULT FALSE,
    is_read_by_parent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Add certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    quiz_title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    instructor_name VARCHAR(255) DEFAULT 'Sara Abdelwahab',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible_to_student BOOLEAN DEFAULT FALSE
);

-- Add weekly reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_quizzes_assigned INTEGER DEFAULT 0,
    total_quizzes_completed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    pending_assignments TEXT[],
    completed_assignments TEXT[],
    attendance_sessions INTEGER DEFAULT 0,
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, child_id, week_start)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parent_children_parent_id ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_id ON parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_parent_id ON parent_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_parent_child ON weekly_reports(parent_id, child_id);
