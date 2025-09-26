-- Add columns to support threaded messaging and sender identification
ALTER TABLE parent_messages 
ADD COLUMN IF NOT EXISTS sender_type VARCHAR(10) DEFAULT 'parent' CHECK (sender_type IN ('parent', 'admin')),
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES parent_messages(id),
ADD COLUMN IF NOT EXISTS subject VARCHAR(255);

-- Update existing messages to have proper sender type
UPDATE parent_messages 
SET sender_type = CASE 
  WHEN admin_response IS NULL AND message IS NOT NULL THEN 'parent'
  ELSE 'parent'
END;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_parent_messages_thread ON parent_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_sender ON parent_messages(sender_type);
