-- Add video_title column to home_content table
ALTER TABLE home_content ADD COLUMN IF NOT EXISTS video_title TEXT;

-- Update existing record to have a default video title if it exists
UPDATE home_content SET video_title = 'Introduction Video' WHERE video_title IS NULL;
