-- Add is_active column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE contacts SET is_active = true WHERE is_active IS NULL;
