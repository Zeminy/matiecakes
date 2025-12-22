-- Add new columns to users table in member_db
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- Update existing users with some default data (Demo purposes)
UPDATE users SET status = 'Active' WHERE status IS NULL;
