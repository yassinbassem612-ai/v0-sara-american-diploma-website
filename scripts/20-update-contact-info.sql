-- Update contact information in home_content table
UPDATE home_content 
SET 
    phone_number = '01020176774',
    center_location = 'zayed-روضة زايد / Dokki-16 engovation شارع هيئة التدريس الدور ٦ سنتر',
    updated_at = NOW()
WHERE id IS NOT NULL;

-- If no record exists, insert a new one
INSERT INTO home_content (
    id,
    phone_number, 
    center_location,
    about_text,
    video_title,
    free_session_link,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '01020176774',
    'zayed-روضة زايد / Dokki-16 engovation شارع هيئة التدريس الدور ٦ سنتر',
    'Welcome to Sara American Diploma - Your premier destination for SAT, ACT, and EST test preparation.',
    'Introduction to Our Program',
    'https://forms.gle/8DZ6TaTAg9qNNmex5',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM home_content);
