-- Add photo support to student questions
ALTER TABLE student_questions 
ADD COLUMN photo_urls TEXT[];

-- Update existing questions to have empty photo array
UPDATE student_questions 
SET photo_urls = '{}' 
WHERE photo_urls IS NULL;
