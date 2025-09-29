-- Add display_order column to quiz_questions table
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set display_order for existing questions based on their current created_at order
WITH ordered_questions AS (
  SELECT 
    id,
    quiz_id,
    ROW_NUMBER() OVER (PARTITION BY quiz_id ORDER BY created_at ASC) as order_num
  FROM quiz_questions
)
UPDATE quiz_questions
SET display_order = ordered_questions.order_num
FROM ordered_questions
WHERE quiz_questions.id = ordered_questions.id;
