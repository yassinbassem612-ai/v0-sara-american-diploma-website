-- Fix the user_can_access_sheet function to resolve ambiguous user_id column reference
CREATE OR REPLACE FUNCTION user_can_access_sheet(sheet_id UUID, input_user_id UUID)
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
    SELECT category, level INTO user_record FROM users WHERE id = input_user_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Fixed ambiguous user_id reference by using input_user_id parameter name
    SELECT ARRAY_AGG(group_id) INTO user_groups 
    FROM group_memberships 
    WHERE user_id = input_user_id;
    
    -- Check if user matches any targeting criteria
    
    -- Check specific users
    IF sheet_record.target_users IS NOT NULL AND input_user_id = ANY(sheet_record.target_users) THEN
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

-- Also update the get_user_accessible_sheets function to use the corrected function
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
