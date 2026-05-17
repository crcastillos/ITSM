-- ITSM-INNOVASAL - SCHEMA DEFINITIVO SIN RECURSIÓN
-- Ejecuta este script en el SQL Editor de Supabase.

-- 1. LIMPIEZA ADICIONAL (Opcional: descomenta si quieres borrar lo anterior)
-- DROP TABLE IF EXISTS assets CASCADE;
-- DROP TABLE IF EXISTS contacts CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- DROP TABLE IF EXISTS asset_types CASCADE;
-- DROP TABLE IF EXISTS asset_status CASCADE;
-- DROP TABLE IF EXISTS service_categories CASCADE;
-- DROP TABLE IF EXISTS service_priorities CASCADE;

-- 2. TABLAS ATÓMICAS (Modificadas con descripción e is_active)
CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS asset_types (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS asset_status (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS service_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS service_priorities (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS service_types (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS service_request_channels (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS departments (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY, 
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL, 
    is_active BOOLEAN DEFAULT true,
    UNIQUE(department_id, name)
);

-- 3. PERFILES DE USUARIO (Añadido is_active)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role_id INTEGER REFERENCES roles(id) DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. FUNCIONES DE SEGURIDAD (Evitan la recursión infinita)
-- Estas funciones se ejecutan como SISTEMA (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT r.name FROM public.roles r 
  JOIN public.user_profiles p ON p.role_id = r.id 
  WHERE p.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 5. TRIGGER DE CREACIÓN DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role_id')::integer, 3)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. TABLAS DE NEGOCIO (Añadido is_active)
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    trade_name TEXT,
    nit TEXT,
    nrc TEXT,
    economic_activity TEXT,
    address TEXT,
    department_id INTEGER REFERENCES departments(id),
    district_id INTEGER REFERENCES districts(id),
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type_id INTEGER REFERENCES asset_types(id),
    status_id INTEGER REFERENCES asset_status(id),
    serial_number TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    service_type TEXT,
    category_id INTEGER REFERENCES service_categories(id),
    priority_id INTEGER REFERENCES service_priorities(id),
    service_owner TEXT,
    availability_schedule TEXT,
    request_canals TEXT[] DEFAULT '{}',
    technical_dependencies TEXT,
    sla_hours INTEGER,
    cost_center TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. SEED DATA
INSERT INTO roles (name) VALUES ('Admin'), ('Gerente TI'), ('Soporte TI') ON CONFLICT DO NOTHING;

-- Asegurar columnas si las tablas ya existían
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sla_hours INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE asset_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE asset_status ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE service_priorities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Asegurar que los registros existentes sean activos
UPDATE roles SET is_active = true WHERE is_active IS NULL;
UPDATE asset_types SET is_active = true WHERE is_active IS NULL;
UPDATE asset_status SET is_active = true WHERE is_active IS NULL;
UPDATE service_categories SET is_active = true WHERE is_active IS NULL;
UPDATE service_priorities SET is_active = true WHERE is_active IS NULL;
UPDATE user_profiles SET is_active = true WHERE is_active IS NULL;
UPDATE clients SET is_active = true WHERE is_active IS NULL;
UPDATE contacts SET is_active = true WHERE is_active IS NULL;
UPDATE assets SET is_active = true WHERE is_active IS NULL;
UPDATE services SET is_active = true WHERE is_active IS NULL;

-- Initial data for service_request_channels
INSERT INTO service_request_channels (name, description) VALUES
('Portal', 'Acceso directo mediante la plataforma web de autoservicio.'),
('Correo', 'Solicitudes recibidas vía email a la mesa de ayuda.'),
('Teléfono', 'Atención telefónica directa con un técnico de soporte.'),
('Presencial', 'Solicitud realizada físicamente en nuestras oficinas.')
ON CONFLICT (name) DO NOTHING;

-- Initial data for service_types
INSERT INTO service_types (name, description) VALUES
('Incidente', 'Interrupción no planificada o reducción de la calidad de un servicio.'),
('Falla', 'Defecto físico o lógico en un activo que requiere reparación.'),
('Solicitud', 'Pedido del usuario para obtener información, asesoramiento o acceso.'),
('Servicio', 'Actividades planificadas o solicitudes para mantener o mejorar el nivel de servicio.'),
('Cambio', 'Adición, modificación o eliminación de cualquier cosa que afecte los servicios.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO asset_types (name) VALUES ('Laptop'), ('Desktop'), ('Server'), ('Network'), ('Phone'), ('Printer') ON CONFLICT DO NOTHING;
INSERT INTO asset_status (name) VALUES ('Available'), ('Assigned'), ('Maintenance'), ('Retired'), ('Broken') ON CONFLICT DO NOTHING;
INSERT INTO service_categories (name) VALUES ('Hardware'), ('Software'), ('Network'), ('Security'), ('User') ON CONFLICT DO NOTHING;
INSERT INTO service_priorities (name) VALUES ('Low'), ('Medium'), ('High'), ('Critical') ON CONFLICT DO NOTHING;

-- Seed Departments and some Districts for El Salvador
INSERT INTO departments (name) VALUES 
('Ahuachapán'), ('Santa Ana'), ('Sonsonate'), ('Chalatenango'), ('La Libertad'), 
('San Salvador'), ('Cuscatlán'), ('La Paz'), ('Cabañas'), ('San Vicente'), 
('Usulután'), ('San Miguel'), ('Morazán'), ('La Unión')
ON CONFLICT DO NOTHING;

-- Seed some sample districts
DO $$
DECLARE
    ss_id INT;
    ll_id INT;
BEGIN
    SELECT id INTO ss_id FROM departments WHERE name = 'San Salvador';
    SELECT id INTO ll_id FROM departments WHERE name = 'La Libertad';

    IF ss_id IS NOT NULL THEN
        INSERT INTO districts (department_id, name) VALUES 
        (ss_id, 'San Salvador Centro'), (ss_id, 'San Salvador Sur'), 
        (ss_id, 'San Salvador Oeste'), (ss_id, 'San Salvador Este')
        ON CONFLICT DO NOTHING;
    END IF;

    IF ll_id IS NOT NULL THEN
        INSERT INTO districts (department_id, name) VALUES 
        (ll_id, 'Libertad Sur'), (ll_id, 'Libertad Este'), 
        (ll_id, 'Libertad Centro'), (ll_id, 'Libertad Oeste')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 8. HABILITAR RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_channels ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS (Usando get_user_role() para evitar recursión)
DROP POLICY IF EXISTS "Public read roles" ON roles;
DROP POLICY IF EXISTS "Admin manage roles" ON roles;
DROP POLICY IF EXISTS "Profiles access" ON user_profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON user_profiles;
DROP POLICY IF EXISTS "Clients access" ON clients;
DROP POLICY IF EXISTS "Contacts access staff" ON contacts;
DROP POLICY IF EXISTS "Assets access staff" ON assets;
DROP POLICY IF EXISTS "Assets view support" ON assets;
DROP POLICY IF EXISTS "Services view" ON services;
DROP POLICY IF EXISTS "Admin manage services" ON services;

-- Atomic Tables Policies

-- roles: Todos pueden ver los nombres de los roles para los joins.
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Admin manage roles" ON roles FOR ALL USING (get_user_role() = 'Admin');

-- user_profiles: El usuario ve el suyo, Admin y Gerente ven todos.
CREATE POLICY "Profiles access" ON user_profiles FOR SELECT 
USING (id = auth.uid() OR get_user_role() IN ('Admin', 'Gerente TI'));

CREATE POLICY "Admin manage profiles" ON user_profiles FOR UPDATE 
USING (get_user_role() = 'Admin');

-- clients: Admin y Gerente TI gestionan todo.
CREATE POLICY "Clients access" ON clients FOR ALL 
USING (get_user_role() IN ('Admin', 'Gerente TI'));

-- contacts: Vinculados a clientes, misma lógica.
CREATE POLICY "Contacts access staff" ON contacts FOR ALL
USING (get_user_role() IN ('Admin', 'Gerente TI'));

-- Tablas Atómicas: Admin gestiona todo
DROP POLICY IF EXISTS "Admin manage asset types" ON asset_types;
DROP POLICY IF EXISTS "Admin manage asset status" ON asset_status;
DROP POLICY IF EXISTS "Admin manage service categories" ON service_categories;
DROP POLICY IF EXISTS "Admin manage service priorities" ON service_priorities;
DROP POLICY IF EXISTS "Admin manage service types" ON service_types;
DROP POLICY IF EXISTS "Admin manage service request channels" ON service_request_channels;
DROP POLICY IF EXISTS "Admin manage departments" ON departments;
DROP POLICY IF EXISTS "Admin manage districts" ON districts;
DROP POLICY IF EXISTS "Public read asset types" ON asset_types;
DROP POLICY IF EXISTS "Public read asset status" ON asset_status;
DROP POLICY IF EXISTS "Public read service categories" ON service_categories;
DROP POLICY IF EXISTS "Public read service priorities" ON service_priorities;
DROP POLICY IF EXISTS "Public read service types" ON service_types;
DROP POLICY IF EXISTS "Public read service request channels" ON service_request_channels;
DROP POLICY IF EXISTS "Public read departments" ON departments;
DROP POLICY IF EXISTS "Public read districts" ON districts;

CREATE POLICY "Public read asset types" ON asset_types FOR SELECT USING (true);
CREATE POLICY "Public read asset status" ON asset_status FOR SELECT USING (true);
CREATE POLICY "Public read service categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read service priorities" ON service_priorities FOR SELECT USING (true);
CREATE POLICY "Public read service types" ON service_types FOR SELECT USING (true);
CREATE POLICY "Public read service request channels" ON service_request_channels FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);

CREATE POLICY "Admin manage asset types" ON asset_types FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage asset status" ON asset_status FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage service categories" ON service_categories FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage service priorities" ON service_priorities FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage service types" ON service_types FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage service request channels" ON service_request_channels FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage departments" ON departments FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
CREATE POLICY "Admin manage districts" ON districts FOR ALL USING (get_user_role() IN ('Admin', 'Gerente TI')) WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));

-- assets: Staff puede ver o gestionar según sea Admin/Gerente
CREATE POLICY "Assets access staff" ON assets FOR ALL 
USING (get_user_role() IN ('Admin', 'Gerente TI'));

CREATE POLICY "Assets view support" ON assets FOR SELECT 
USING (get_user_role() = 'Soporte TI');

-- services: Cualquiera logueado puede ver el catálogo. Admin y Gerente pueden gestionar.
CREATE POLICY "Services view" ON services FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage services" ON services FOR ALL
USING (get_user_role() IN ('Admin', 'Gerente TI'))
WITH CHECK (get_user_role() IN ('Admin', 'Gerente TI'));
