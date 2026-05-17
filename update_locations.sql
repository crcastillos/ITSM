
-- Tablas de Ubicación
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(department_id, name)
);

-- Asegurar RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read departments" ON departments;
DROP POLICY IF EXISTS "Admin manage departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin manage departments" ON departments FOR ALL USING (get_user_role() = 'Admin');

DROP POLICY IF EXISTS "Public read districts" ON districts;
DROP POLICY IF EXISTS "Admin manage districts" ON districts;
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Admin manage districts" ON districts FOR ALL USING (get_user_role() = 'Admin');

-- Actualizar Clientes para usar ubicación
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trade_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nit TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nrc TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS economic_activity TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id);

-- Actualizar Políticas de Clientes y Contactos para Gerente
DROP POLICY IF EXISTS "Clients access" ON clients;
CREATE POLICY "Clients access" ON clients FOR ALL 
USING (get_user_role() IN ('Admin', 'Gerente TI'));

DROP POLICY IF EXISTS "Contacts access staff" ON contacts;
CREATE POLICY "Contacts access staff" ON contacts FOR ALL
USING (get_user_role() IN ('Admin', 'Gerente TI'));

-- Seed inicial de departamentos (Ejemplo El Salvador)
INSERT INTO departments (name) VALUES 
('San Salvador'), ('La Libertad'), ('Santa Ana'), ('San Miguel'), ('Sonsonate'), 
('La Paz'), ('La Unión'), ('Usulután'), ('Cuscatlán'), ('Ahuachapán'), 
('Chalatenango'), ('Morazán'), ('San Vicente'), ('Cabañas')
ON CONFLICT (name) DO NOTHING;
