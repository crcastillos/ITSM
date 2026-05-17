-- Create service_request_channels table
CREATE TABLE IF NOT EXISTS service_request_channels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed initial data
INSERT INTO service_request_channels (name, description) VALUES
('Portal', 'Acceso directo mediante la plataforma web de autoservicio.'),
('Correo', 'Solicitudes recibidas vía email a la mesa de ayuda.'),
('Teléfono', 'Atención telefónica directa con un técnico de soporte.'),
('Presencial', 'Solicitud realizada físicamente en nuestras oficinas.')
ON CONFLICT (name) DO NOTHING;
