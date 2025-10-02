-- Add edited_text column to generated_content table
-- Run this in your Supabase SQL Editor

ALTER TABLE generated_content 
ADD COLUMN IF NOT EXISTS edited_text TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'generated_content' 
ORDER BY ordinal_position;