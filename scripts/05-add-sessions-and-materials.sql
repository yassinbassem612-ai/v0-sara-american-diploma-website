-- Add sessions table for scheduling
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('sat', 'act', 'est', 'all')),
    level VARCHAR NOT NULL CHECK (level IN ('basics', 'advanced', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add study materials table for file management
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR NOT NULL, -- pdf, image, excel, etc.
    category VARCHAR NOT NULL CHECK (category IN ('sat', 'act', 'est', 'all')),
    level VARCHAR NOT NULL CHECK (level IN ('basics', 'advanced', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on study_materials" ON study_materials FOR ALL USING (true);
