# 🧵 Sistema de Cotizaciones Textil

Aplicación web full-stack para gestionar clientes, catálogo de prendas, precios especiales y generación de cotizaciones en PDF.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS + CSS personalizado (dark mode)
- **Backend**: Supabase (PostgreSQL + Storage)
- **PDF**: @react-pdf/renderer (generación 100% en el navegador)
- **Íconos**: Lucide React

---

## Guía de Configuración y Despliegue

### 1. Configurar Supabase

1. Ir a supabase.com y crear un proyecto gratuito.
2. En el panel de Supabase, ir a **SQL Editor**.
3. Copiar y ejecutar el contenido del archivo `supabase/schema.sql`.
4. Ir a **Storage** > **New Bucket**:
   - Nombre: `cotizacion-assets`
   - Marcar como **Public**

### 2. Variables de Entorno

Copiar `.env.local.example` a `.env.local` y completar con tus claves de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Las claves se encuentran en Supabase > **Project Settings** > **API**.

### 3. Instalar y Correr

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

---

## Despliegue en Vercel (Gratuito)

### Opción A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Opción B — Vercel Dashboard

1. Subir el código a GitHub.
2. Ir a vercel.com > New Project > Importar repositorio.
3. En Environment Variables, agregar las dos variables de Supabase.
4. Clic en Deploy.

---

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | / | Estadísticas y accesos rápidos |
| Productos | /productos | CRUD de prendas con upload de imágenes |
| Clientes | /clientes | CRUD de clientes + precios especiales |
| Cotizaciones | /cotizaciones | Generador con descarga de PDF |
| Configuración | /configuracion | Logos, firma, datos empresa, condiciones |

---

## Notas Importantes

- **Logos y firma**: Se suben desde el módulo Configuración directamente a Supabase Storage.
- **Precios especiales**: Si un cliente tiene precio especial para un producto, se aplica automáticamente. El precio siempre se puede editar manualmente.
- **Correlativo**: Se genera automáticamente. Puedes ajustarlo antes de guardar.
- **PDF**: La generación ocurre 100% en el navegador del usuario.
