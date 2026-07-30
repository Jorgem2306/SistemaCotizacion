-- ============================================================
-- SISTEMA DE COTIZACIONES TEXTIL — ESQUEMA SUPABASE
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase

-- ─── EXTENSIONES ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLAS ──────────────────────────────────────────────────

-- Productos / Prendas
CREATE TABLE IF NOT EXISTS productos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  imagen_url  TEXT,
  precio_base NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  ruc         TEXT,
  contacto    TEXT,
  correo      TEXT,
  telefono    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Precios Especiales (relación cliente ↔ producto)
CREATE TABLE IF NOT EXISTS precios_especiales (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  producto_id         UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  precio_personalizado NUMERIC(10, 2) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, producto_id)
);

-- Secuencia para número correlativo de cotizaciones
CREATE SEQUENCE IF NOT EXISTS cotizacion_correlativo_seq START 1;

-- Cotizaciones (cabecera)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_correlativo TEXT NOT NULL UNIQUE DEFAULT LPAD(NEXTVAL('cotizacion_correlativo_seq')::TEXT, 6, '0'),
  cliente_id        UUID NOT NULL REFERENCES clientes(id),
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  total_general     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  observaciones     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Ítems de Cotización (detalle)
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id  UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id    UUID REFERENCES productos(id),
  nombre_prenda  TEXT NOT NULL,
  descripcion    TEXT,
  imagen_url     TEXT,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  cantidad       INTEGER NOT NULL DEFAULT 1,
  total_linea    NUMERIC(12, 2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED,
  orden          INTEGER DEFAULT 0
);

-- Configuración global (fila única)
CREATE TABLE IF NOT EXISTS configuracion (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_principal_url  TEXT,
  logo_secundario_url TEXT,
  firma_url           TEXT,
  logos_pie_urls      TEXT[], -- Array de URLs de logos del pie
  emisor_nombre       TEXT DEFAULT 'Nombre del Emisor',
  emisor_cargo        TEXT DEFAULT 'Cargo',
  empresa_ruc         TEXT,
  empresa_direccion   TEXT,
  empresa_telefono    TEXT,
  empresa_correo      TEXT,
  condiciones_venta   TEXT DEFAULT 'Días de entrega: 20 días hábiles
Lugar de entrega: Almacén del cliente
Forma de pago: 50% adelanto / 50% contra entrega
Precios incluyen IGV (18%)
Validez de la cotización: 15 días',
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar fila de configuración inicial
INSERT INTO configuracion (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Habilitar RLS en todas las tablas
ALTER TABLE productos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios_especiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion      ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (para prototipo — en producción restringir por auth.uid())
CREATE POLICY "Public read productos"           ON productos          FOR SELECT USING (true);
CREATE POLICY "Public write productos"          ON productos          FOR ALL    USING (true);
CREATE POLICY "Public read clientes"            ON clientes           FOR SELECT USING (true);
CREATE POLICY "Public write clientes"           ON clientes           FOR ALL    USING (true);
CREATE POLICY "Public read precios_especiales"  ON precios_especiales FOR SELECT USING (true);
CREATE POLICY "Public write precios_especiales" ON precios_especiales FOR ALL    USING (true);
CREATE POLICY "Public read cotizaciones"        ON cotizaciones       FOR SELECT USING (true);
CREATE POLICY "Public write cotizaciones"       ON cotizaciones       FOR ALL    USING (true);
CREATE POLICY "Public read cotizacion_items"    ON cotizacion_items   FOR SELECT USING (true);
CREATE POLICY "Public write cotizacion_items"   ON cotizacion_items   FOR ALL    USING (true);
CREATE POLICY "Public read configuracion"       ON configuracion      FOR SELECT USING (true);
CREATE POLICY "Public write configuracion"      ON configuracion      FOR ALL    USING (true);

-- ─── STORAGE BUCKET ──────────────────────────────────────────
-- Ejecutar desde Supabase Dashboard > Storage > New Bucket:
-- Nombre: cotizacion-assets | Público: true
-- O ejecutar desde SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('cotizacion-assets', 'cotizacion-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Política de Storage pública
CREATE POLICY "Public storage access" ON storage.objects
  FOR ALL USING (bucket_id = 'cotizacion-assets');
