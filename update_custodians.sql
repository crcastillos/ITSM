-- Create Custodians table (Internal personnel at the client site)
CREATE TABLE IF NOT EXISTS client_custodians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    job_title VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Assets table to use custodian instead of system user
ALTER TABLE assets 
DROP COLUMN IF EXISTS responsible_user_id,
ADD COLUMN IF NOT EXISTS custodian_id UUID REFERENCES client_custodians(id);

COMMENT ON COLUMN assets.custodian_id IS 'Specific person at the client organization responsible for the physical asset';
