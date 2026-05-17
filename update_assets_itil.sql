-- Improved Assets Schema based on ITIL v4
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS asset_tag VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS model VARCHAR(100),
ADD COLUMN IF NOT EXISTS physical_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES user_profiles(id);

COMMENT ON COLUMN assets.asset_tag IS 'Unique organization tracking tag';
COMMENT ON COLUMN assets.responsible_user_id IS 'System user responsible for managing this asset (Admin/Technician)';
