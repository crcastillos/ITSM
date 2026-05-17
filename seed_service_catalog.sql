-- Seed Service Catalog with ITIL v4 compliant data
-- Includes 5 services per type (Incidente, Falla, Solicitud, Mantenimiento, Cambio)

DO $$
DECLARE
    cat_hw INT; cat_sw INT; cat_net INT; cat_sec INT; cat_usr INT;
    prio_low INT; prio_med INT; prio_high INT; prio_crit INT;
BEGIN
    -- Get Category IDs
    SELECT id INTO cat_hw FROM service_categories WHERE name = 'Hardware';
    SELECT id INTO cat_sw FROM service_categories WHERE name = 'Software';
    SELECT id INTO cat_net FROM service_categories WHERE name = 'Network';
    SELECT id INTO cat_sec FROM service_categories WHERE name = 'Security';
    SELECT id INTO cat_usr FROM service_categories WHERE name = 'User';

    -- Get Priority IDs
    SELECT id INTO prio_low FROM service_priorities WHERE name = 'Low';
    SELECT id INTO prio_med FROM service_priorities WHERE name = 'Medium';
    SELECT id INTO prio_high FROM service_priorities WHERE name = 'High';
    SELECT id INTO prio_crit FROM service_priorities WHERE name = 'Critical';

    -- Delete existing dummy data to avoid duplicates if re-running
    DELETE FROM services WHERE name IN (
        'Falla de conexión a Internet', 'Error al iniciar sesión en ERP', 'Impresora atascada en oficina principal', 
        'Bloqueo de cuenta por intentos fallidos', 'Aplicación se cierra inesperadamente',
        'Pantalla azul (BSOD) en laptop', 'Disco duro dañado', 'Monitor no enciende', 
        'Puerto de red físico dañado', 'Batería hinchada en laptop',
        'Instalación de software de diseño', 'Creación de cuenta de usuario', 'Acceso a carpeta de red', 
        'Solicitud de nuevo mouse/teclado', 'Configuración de correo en móvil',
        'Limpieza física de servidores', 'Actualización de sistema operativo', 'Backup preventivo semanal', 
        'Escaneo de vulnerabilidades', 'Revisión de UPS y baterías',
        'Migración de DB a nueva arquitectura', 'Implementación de MFA', 'Sustitución de Switch Core', 
        'Renovación de Licencias', 'Upgrade de Memoria RAM en Servidor'
    );

    -- 1. INCIDENTES
    INSERT INTO services (name, description, category_id, priority_id, service_type, service_owner, availability_schedule, request_canals, technical_dependencies, sla_hours) VALUES
    ('Falla de conexión a Internet', 'Interrupción total o parcial de la conexión de red en una sede.', cat_net, prio_high, 'Incidente', 'Redes e Infraestructura', '24/7', ARRAY['Portal', 'Teléfono'], 'Proveedor de ISP, Firewall Central', 4),
    ('Error al iniciar sesión en ERP', 'Usuarios no pueden acceder al sistema contable principal.', cat_sw, prio_crit, 'Incidente', 'Sistemas de Gestión', 'Lun-Vie 07:00-19:00', ARRAY['Portal', 'Teléfono'], 'Active Directory, SQL Server', 2),
    ('Impresora atascada en oficina principal', 'Hardware de impresión no disponible por atasco físico.', cat_hw, prio_low, 'Incidente', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Hardware físico', 8),
    ('Bloqueo de cuenta por intentos fallidos', 'Cuenta de usuario inhabilitada por seguridad.', cat_sec, prio_med, 'Incidente', 'Mesa de Ayuda', 'Lun-Vie 08:00-18:00', ARRAY['Portal', 'Correo'], 'Active Directory', 1),
    ('Aplicación se cierra inesperadamente', 'Cierre forzoso de herramientas ofimáticas o de negocio.', cat_sw, prio_med, 'Incidente', 'Soporte Aplicaciones', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'SO Windows/macOS', 6);

    -- 2. FALLAS
    INSERT INTO services (name, description, category_id, priority_id, service_type, service_owner, availability_schedule, request_canals, technical_dependencies, sla_hours) VALUES
    ('Pantalla azul (BSOD) en laptop', 'Error crítico de sistema operativo que impide el uso del equipo.', cat_hw, prio_med, 'Falla', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Presencial', 'Portal'], 'Hardware/Drivers', 12),
    ('Disco duro dañado', 'El dispositivo de almacenamiento presenta sectores defectuosos.', cat_hw, prio_high, 'Falla', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Garantía del fabricante', 24),
    ('Monitor no enciende', 'Falla eléctrica o de panel en periférico de visualización.', cat_hw, prio_low, 'Falla', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Suministro eléctrico', 16),
    ('Puerto de red físico dañado', 'Conector RJ45 quebrado o sin conectividad en estación.', cat_net, prio_low, 'Falla', 'Redes e Infraestructura', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Switch de piso', 48),
    ('Batería hinchada en laptop', 'Deformación física de la batería que pone en riesgo el equipo.', cat_hw, prio_high, 'Falla', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Presencial'], 'Hardware certificado', 4);

    -- 3. SOLICITUDES
    INSERT INTO services (name, description, category_id, priority_id, service_type, service_owner, availability_schedule, request_canals, technical_dependencies, sla_hours) VALUES
    ('Instalación de software de diseño', 'Solicitud de despliegue de Adobe CC o AutoCAD.', cat_sw, prio_low, 'Solicitud', 'Soporte Aplicaciones', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Licenciamiento vigente', 24),
    ('Creación de cuenta de usuario', 'Alta en sistemas para nuevo colaborador.', cat_usr, prio_med, 'Solicitud', 'Gestión de Identidades', 'Lun-Vie 08:00-18:00', ARRAY['Portal', 'Correo'], 'RRHH Workflow', 8),
    ('Acceso a carpeta de red', 'Permisos de lectura/escritura en servidor de archivos.', cat_sec, prio_med, 'Solicitud', 'Seguridad de Información', 'Lun-Vie 08:00-18:00', ARRAY['Portal'], 'Aprobación de jefe de área', 4),
    ('Solicitud de nuevo mouse/teclado', 'Repuesto o periféricos adicionales para el puesto.', cat_hw, prio_low, 'Solicitud', 'Soporte Técnico Local', 'Lun-Vie 08:00-18:00', ARRAY['Portal', 'Presencial'], 'Inventario disponible', 48),
    ('Configuración de correo en móvil', 'Sincronización de Outlook en dispositivo corporativo.', cat_sw, prio_low, 'Solicitud', 'Mesa de Ayuda', 'Lun-Vie 08:00-18:00', ARRAY['Portal', 'Teléfono'], 'Intune / MDM', 4);

    -- 4. SERVICIOS (MANTENIMIENTO)
    INSERT INTO services (name, description, category_id, priority_id, service_type, service_owner, availability_schedule, request_canals, technical_dependencies, sla_hours) VALUES
    ('Limpieza física de servidores', 'Remoción de polvo y revisión de ventilación en Datacenter.', cat_hw, prio_med, 'Servicio', 'Infraestructura', 'Fin de semana', ARRAY['Portal'], 'Ventana de mantenimiento', 72),
    ('Actualización de sistema operativo', 'Despliegue de parches críticos de Windows Update.', cat_sw, prio_med, 'Servicio', 'Soporte Técnico Local', 'Lun-Vie 18:00-22:00', ARRAY['Portal'], 'WSUS / Servidor de parches', 24),
    ('Backup preventivo semanal', 'Verificación de integridad de copias de seguridad.', cat_sec, prio_high, 'Servicio', 'Backup Administrator', 'Diario 00:00', ARRAY['Portal'], 'Veeam / Tape Library', 12),
    ('Escaneo de vulnerabilidades', 'Detección proactiva de debilidades en la red.', cat_sec, prio_high, 'Servicio', 'Cybersecurity Team', 'Trimestral', ARRAY['Portal'], 'Nessus / Rapid7', 168),
    ('Revisión de UPS y baterías', 'Prueba de carga y estado de salud de sistemas de energía.', cat_hw, prio_med, 'Servicio', 'Infraestructura Eléctrica', 'Mensual', ARRAY['Portal'], 'Contrato de mantenimiento', 48);

    -- 5. CAMBIOS
    INSERT INTO services (name, description, category_id, priority_id, service_type, service_owner, availability_schedule, request_canals, technical_dependencies, sla_hours) VALUES
    ('Migración de DB a nueva arquitectura', 'Pasar base de datos de On-Premise a AWS RDS.', cat_sw, prio_crit, 'Cambio', 'Database Administrator', 'Viernes 20:00', ARRAY['Portal'], 'Conectividad AWS, Plan de Rollback', 120),
    ('Implementación de MFA', 'Activación obligatoria de doble factor de autenticación.', cat_sec, prio_high, 'Cambio', 'Seguridad de Información', 'Faseado por departamentos', ARRAY['Portal'], 'Microsoft Authenticator', 48),
    ('Sustitución de Switch Core', 'Cambio de hardware central de comunicaciones.', cat_net, prio_crit, 'Cambio', 'Redes', 'Domingo 02:00', ARRAY['Portal'], 'Fibra Óptica, Configuración VLANS', 6),
    ('Renovación de Licencias', 'Actualización anual de suscripciones de software.', cat_sw, prio_med, 'Cambio', 'IT Procurement', 'Anual', ARRAY['Portal', 'Correo'], 'Presupuesto IT', 720),
    ('Upgrade de Memoria RAM en Servidor', 'Incremento de capacidad para máquinas virtuales.', cat_hw, prio_high, 'Cambio', 'Infraestructura', 'Sábado 10:00', ARRAY['Portal'], 'Hardware certificado compatible', 8);

END $$;
