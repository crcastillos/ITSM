-- Update services table for ITIL v4 compliance
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'Solicitud';
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_owner TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS availability_schedule TEXT DEFAULT 'Lun-Vie 08:00-18:00';
ALTER TABLE services ADD COLUMN IF NOT EXISTS request_canals TEXT[] DEFAULT ARRAY['Portal'];
ALTER TABLE services ADD COLUMN IF NOT EXISTS technical_dependencies TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 24;
