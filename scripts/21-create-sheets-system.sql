-- Create sheets table for storing sheet links and metadata
CREATE TABLE IF NOT EXISTS sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    created_by_admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Targeting options
    target_categories TEXT[], -- Array of categories
    target_levels TEXT[], -- Array of levels  
    target_groups UUID[], -- Array of group IDs
    target_users UUID[], -- Array of specific user IDs
    
    -- Additional metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sheets_target_categories ON sheets USING GIN (target_categories);
CREATE INDEX IF NOT EXISTS idx_sheets_target_levels ON sheets USING GIN (target_levels);
CREATE INDEX IF NOT EXISTS idx_sheets_target_groups ON sheets USING GIN (target_groups);
CREATE INDEX IF NOT EXISTS idx_sheets_target_users ON sheets USING GIN (target_users);
CREATE INDEX IF NOT EXISTS idx_sheets_active ON sheets (is_active);

-- Create function to check if user can access a sheet
CREATE OR REPLACE FUNCTION user_can_access_sheet(sheet_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sheet_record RECORD;
    user_record RECORD;
    user_groups UUID[];
BEGIN
    -- Get sheet targeting info
    SELECT target_categories, target_levels, target_groups, target_users, is_active
    INTO sheet_record
    FROM sheets 
    WHERE id = sheet_id;
    
    -- Return false if sheet doesn't exist or is inactive
    IF NOT FOUND OR NOT sheet_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Get user info
    SELECT category, level INTO user_record FROM users WHERE id = user_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's groups
    SELECT ARRAY_AGG(group_id) INTO user_groups 
    FROM group_memberships 
    WHERE user_id = user_can_access_sheet.user_id;
    
    -- Check if user matches any targeting criteria
    
    -- Check specific users
    IF sheet_record.target_users IS NOT NULL AND user_id = ANY(sheet_record.target_users) THEN
        RETURN TRUE;
    END IF;
    
    -- Check categories
    IF sheet_record.target_categories IS NOT NULL AND user_record.category = ANY(sheet_record.target_categories) THEN
        RETURN TRUE;
    END IF;
    
    -- Check levels
    IF sheet_record.target_levels IS NOT NULL AND user_record.level = ANY(sheet_record.target_levels) THEN
        RETURN TRUE;
    END IF;
    
    -- Check groups
    IF sheet_record.target_groups IS NOT NULL AND user_groups IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM unnest(sheet_record.target_groups) AS target_group
            WHERE target_group = ANY(user_groups)
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
