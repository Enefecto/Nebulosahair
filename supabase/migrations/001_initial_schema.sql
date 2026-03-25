-- ============================================================
-- NebulosHair — Migración inicial
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'NebulosHair',
    whatsapp_number TEXT,
    instagram_url TEXT,
    address TEXT,
    address_lat FLOAT,
    address_lng FLOAT,
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category TEXT NOT NULL CHECK (category IN ('corte','barberia','coloracion','permanente','otro')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE schedule_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_working BOOLEAN NOT NULL DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    break_start TIME,
    break_end TIME,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (week_start_date, day_of_week)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_phone TEXT,
    service_id UUID REFERENCES services(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','confirmed','completed','cancelled')),
    price_charged INTEGER,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'whatsapp'
        CHECK (source IN ('whatsapp','instagram','walk_in','web')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    service_id UUID REFERENCES services(id),
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE allowed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_site_config_updated_at
    BEFORE UPDATE ON site_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- site_config: lectura pública
CREATE POLICY "site_config_public_read" ON site_config
    FOR SELECT TO anon USING (true);
CREATE POLICY "site_config_auth_write" ON site_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- services: lectura pública solo activos
CREATE POLICY "services_public_read" ON services
    FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "services_auth_all" ON services
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- schedule_config: lectura pública
CREATE POLICY "schedule_public_read" ON schedule_config
    FOR SELECT TO anon USING (true);
CREATE POLICY "schedule_auth_write" ON schedule_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- gallery: lectura pública solo visibles
CREATE POLICY "gallery_public_read" ON gallery
    FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "gallery_auth_all" ON gallery
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- appointments: solo autenticados
CREATE POLICY "appointments_auth_all" ON appointments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- allowed_emails: solo service role (no expuesta a anon ni authenticated)
-- No policies para anon/authenticated => acceso denegado por defecto

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO site_config (
    business_name, whatsapp_number, instagram_url,
    address, address_lat, address_lng
) VALUES (
    'NebulosHair',
    '+56912345678',
    'https://www.instagram.com/nebulosahair.cl/',
    'Paso El Roble 50, La Florida, Santiago, Chile',
    -33.5167,
    -70.5972
);
