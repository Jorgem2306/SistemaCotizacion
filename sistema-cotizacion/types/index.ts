// Tipos TypeScript para el Sistema de Cotizaciones Textil

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_base: number;
  created_at?: string;
}

export interface Cliente {
  id: string;
  razon_social: string;
  ruc: string | null;
  contacto: string | null;
  correo: string | null;
  telefono: string | null;
  created_at?: string;
}

export interface PrecioEspecial {
  id: string;
  cliente_id: string;
  producto_id: string;
  precio_personalizado: number;
  created_at?: string;
  producto?: Producto;
}

export interface CotizacionItem {
  id?: string;
  cotizacion_id?: string;
  producto_id?: string | null;
  nombre_prenda: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_unitario: number;
  cantidad: number;
  total_linea?: number;
  orden?: number;
}

export interface Cotizacion {
  id: string;
  numero_correlativo: string;
  cliente_id: string;
  fecha: string;
  total_general: number;
  observaciones: string | null;
  created_at?: string;
  cliente?: Cliente;
  items?: CotizacionItem[];
}

export interface Configuracion {
  id: string;
  logo_principal_url: string | null;
  logo_secundario_url: string | null;
  firma_url: string | null;
  logos_pie_urls: string[] | null;
  emisor_nombre: string | null;
  emisor_cargo: string | null;
  empresa_ruc: string | null;
  empresa_direccion: string | null;
  empresa_telefono: string | null;
  empresa_correo: string | null;
  condiciones_venta: string | null;
  updated_at?: string;
}

// Item en el formulario de cotización (antes de guardar)
export interface CotizacionItemForm {
  id: string; // temporal, para React key
  producto_id: string | null;
  nombre_prenda: string;
  descripcion: string;
  imagen_url: string | null;
  precio_unitario: number;
  cantidad: number;
}
