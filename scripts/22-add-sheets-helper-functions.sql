-- Create function to get all sheets accessible to a specific user
CREATE OR REPLACE FUNCTION get_user_accessible_sheets(user_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    link_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.link_url,
        s.description,
        s.created_at
    FROM sheets s
    WHERE s.is_active = true
    AND user_can_access_sheet(s.id, user_id)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get sheet statistics for admin
CREATE OR REPLACE FUNCTION get_sheet_stats(sheet_id UUID)
RETURNS TABLE (
    total_targeted_users BIGINT,
    categories_count INTEGER,
    levels_count INTEGER,
    groups_count INTEGER,
    specific_users_count INTEGER
) AS $$
DECLARE
    sheet_record RECORD;
    user_count BIGINT := 0;
BEGIN
    -- Get sheet targeting info
    SELECT target_categories, target_levels, target_groups, target_users
    INTO sheet_record
    FROM sheets 
    WHERE id = sheet_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::BIGINT, 0, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Count users who can access this sheet
    SELECT COUNT(DISTINCT u.id) INTO user_count
    FROM users u
    LEFT JOIN group_memberships gm ON u.id = gm.user_id
    WHERE u.role = 'student'
    AND (
        -- Check specific users
        (sheet_record.target_users IS NOT NULL AND u.id = ANY(sheet_record.target_users))
        OR
        -- Check categories
        (sheet_record.target_categories IS NOT NULL AND u.category = ANY(sheet_record.target_categories))
        OR
        -- Check levels
        (sheet_record.target_levels IS NOT NULL AND u.level = ANY(sheet_record.target_levels))
        OR
        -- Check groups
        (sheet_record.target_groups IS NOT NULL AND gm.group_id = ANY(sheet_record.target_groups))
    );
    
    RETURN QUERY SELECT 
        user_count,
        COALESCE(array_length(sheet_record.target_categories, 1), 0),
        COALESCE(array_length(sheet_record.target_levels, 1), 0),
        COALESCE(array_length(sheet_record.target_groups, 1), 0),
        COALESCE(array_length(sheet_record.target_users, 1), 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to validate sheet targeting
CREATE OR REPLACE FUNCTION validate_sheet_targeting(
    target_categories TEXT[],
    target_levels TEXT[],
    target_groups UUID[],
    target_users UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_categories TEXT[] := ARRAY['SAT', 'IELTS', 'TOEFL', 'General English'];
    valid_levels TEXT[] := ARRAY['Beginner', 'Intermediate', 'Advanced'];
    group_exists BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- Validate categories
    IF target_categories IS NOT NULL THEN
        IF NOT (target_categories <@ valid_categories) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate levels
    IF target_levels IS NOT NULL THEN
        IF NOT (target_levels <@ valid_levels) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate groups exist
    IF target_groups IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM unnest(target_groups) AS target_group
            WHERE NOT EXISTS(SELECT 1 FROM groups WHERE id = target_group)
        ) INTO group_exists;
        
        IF group_exists THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate users exist and are students
    IF target_users IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM unnest(target_users) AS target_user
            WHERE NOT EXISTS(SELECT 1 FROM users WHERE id = target_user AND role = 'student')
        ) INTO user_exists;
        
        IF user_exists THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate sheet targeting before insert/update
CREATE OR REPLACE FUNCTION validate_sheet_before_save()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_sheet_targeting(
        NEW.target_categories,
        NEW.target_levels,
        NEW.target_groups,
        NEW.target_users
    ) THEN
        RAISE EXCEPTION 'Invalid targeting configuration';
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_sheet_targeting_trigger ON sheets;
CREATE TRIGGER validate_sheet_targeting_trigger
    BEFORE INSERT OR UPDATE ON sheets
    FOR EACH ROW
    EXECUTE FUNCTION validate_sheet_before_save();

-- Create index for better performance on user access queries
CREATE INDEX IF NOT EXISTS idx_users_role_category_level ON users (role, category, level);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_group ON group_memberships (user_id, group_id);
