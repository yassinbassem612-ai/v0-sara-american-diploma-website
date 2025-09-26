-- Drop and recreate the user_can_access_sheet function with proper parameter naming
DROP FUNCTION IF EXISTS user_can_access_sheet(UUID, UUID);

CREATE OR REPLACE FUNCTION user_can_access_sheet(sheet_id UUID, input_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sheet_record RECORD;
    user_record RECORD;
    is_in_group BOOLEAN := FALSE;
BEGIN
    -- Get sheet targeting configuration
    SELECT target_categories, target_levels, target_groups, target_users, is_active
    INTO sheet_record
    FROM sheets 
    WHERE id = sheet_id;
    
    -- If sheet doesn't exist or is inactive, deny access
    IF NOT FOUND OR NOT sheet_record.is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Get user information
    SELECT category, level, role
    INTO user_record
    FROM users 
    WHERE id = input_user_id;
    
    -- If user doesn't exist or is not a student, deny access
    IF NOT FOUND OR user_record.role != 'student' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is specifically targeted
    IF sheet_record.target_users IS NOT NULL AND input_user_id = ANY(sheet_record.target_users) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user's category is targeted
    IF sheet_record.target_categories IS NOT NULL AND user_record.category = ANY(sheet_record.target_categories) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user's level is targeted
    IF sheet_record.target_levels IS NOT NULL AND user_record.level = ANY(sheet_record.target_levels) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is in any targeted groups
    IF sheet_record.target_groups IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM group_memberships gm
            WHERE gm.user_id = input_user_id 
            AND gm.group_id = ANY(sheet_record.target_groups)
        ) INTO is_in_group;
        
        IF is_in_group THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- If no targeting criteria match, deny access
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update the get_user_accessible_sheets function to use the corrected function
DROP FUNCTION IF EXISTS get_user_accessible_sheets(UUID);

CREATE OR REPLACE FUNCTION get_user_accessible_sheets(input_user_id UUID)
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
    AND user_can_access_sheet(s.id, input_user_id)
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;
