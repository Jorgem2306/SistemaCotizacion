'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { Search, ChevronDown, ChevronUp, Clock, FileText, Eye, FileDown, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Configuracion, CotizacionItemForm, Cliente } from '@/types';
import dynamicImport from 'next/dynamic';

const PDFPreview = dynamicImport(() => import('@/components/pdf/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 580, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f1f27', color: '#9999b3', borderRadius: '0 0 12px 12px', gap: 12 }}>
      <div className="spinner" /> Generando vista previa...
    </div>
  ),
});

interface CotizacionItem {
  id: string;
  nombre_prenda: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio_unitario: number;
  cantidad: number;
  orden: number;
  producto_id?: string | null;
}

interface Cotizacion {
  id: string;
  numero_correlativo: string;
  fecha: string;
  total_general: number;
  observaciones: string | null;
  created_at: string;
  clientes: { id: string; razon_social: string; ruc: string | null; contacto: string | null; correo: string | null; telefono: string | null } | null;
  cotizacion_items: CotizacionItem[];
  expanded?: boolean;
}

interface PreviewState {
  cotId: string;
  loading: boolean;
  images: {
    itemImages: Record<string, string>;
    configImages: { logoPrincipal?: string; logoSecundario?: string; firma?: string; logosPie?: string[] };
  } | null;
}

export default function HistorialPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState<Configuracion | null>(null);

  // Modal de preview
  const [previewModal, setPreviewModal] = useState<{ cot: Cotizacion; state: PreviewState } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: cfg }] = await Promise.all([
      supabase
        .from('cotizaciones')
        .select(`
          id, numero_correlativo, fecha, total_general, observaciones, created_at,
          clientes(id, razon_social, ruc, contacto, correo, telefono),
          cotizacion_items(id, nombre_prenda, descripcion, imagen_url, precio_unitario, cantidad, orden, producto_id)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('configuracion').select('*').limit(1).single(),
    ]);

    setCotizaciones(
      (data ?? []).map(c => ({
        ...c,
        clientes: Array.isArray(c.clientes) ? c.clientes[0] ?? null : c.clientes,
        cotizacion_items: (c.cotizacion_items ?? []).sort((a: CotizacionItem, b: CotizacionItem) => a.orden - b.orden),
        expanded: false,
      })) as Cotizacion[]
    );
    setConfig(cfg ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(id: string) {
    setCotizaciones(prev =>
      prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c)
    );
  }

  async function deleteCotizacion(id: string, numero: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la cotización ${numero}? Esta acción no se puede deshacer.`)) return;
    
    // Primero eliminar items (por si no hay cascada) y luego la cotización
    await supabase.from('cotizacion_items').delete().eq('cotizacion_id', id);
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
    
    if (error) {
      toast('Error al eliminar cotización', 'error');
    } else {
      toast(`Cotización ${numero} eliminada`, 'success');
      setCotizaciones(prev => prev.filter(c => c.id !== id));
    }
  }

  const filtered = cotizaciones.filter(c => {
    const q = search.toLowerCase();
    return (
      c.numero_correlativo.includes(q) ||
      (c.clientes?.razon_social ?? '').toLowerCase().includes(q) ||
      (c.clientes?.ruc ?? '').includes(q)
    );
  });

  const totalGeneral = filtered.reduce((sum, c) => sum + Number(c.total_general), 0);

  /** Carga imágenes de la cotización y las mete en previewImages */
  async function loadPreviewImages(cot: Cotizacion): Promise<NonNullable<PreviewState['images']>> {
    const { urlToBase64 } = await import('@/lib/storage');
    const itemImages: Record<string, string> = {};
    for (const item of cot.cotizacion_items) {
      if (item.imagen_url) {
        const b64 = await urlToBase64(item.imagen_url);
        if (b64) itemImages[item.producto_id ?? item.id] = b64;
      }
    }
    const ci: { logoPrincipal?: string; logoSecundario?: string; firma?: string; logosPie?: string[] } = {};
    if (config) {
      if (config.logo_principal_url)  ci.logoPrincipal  = (await urlToBase64(config.logo_principal_url))  || undefined;
      if (config.logo_secundario_url) ci.logoSecundario = (await urlToBase64(config.logo_secundario_url)) || undefined;
      if (config.firma_url)           ci.firma           = (await urlToBase64(config.firma_url))           || undefined;
      if (config.logos_pie_urls?.length) {
        ci.logosPie = await Promise.all(config.logos_pie_urls.map(u => urlToBase64(u)));
      }
    }
    return { itemImages, configImages: ci };
  }

  /** Abre el modal de vista previa */
  async function openPreview(cot: Cotizacion) {
    if (!config) { toast('Configuración no cargada', 'error'); return; }
    setPreviewModal({ cot, state: { cotId: cot.id, loading: true, images: null } });
    try {
      const images = await loadPreviewImages(cot);
      setPreviewModal(prev => prev ? { ...prev, state: { cotId: cot.id, loading: false, images } } : null);
    } catch {
      setPreviewModal(null);
      toast('Error al cargar la vista previa', 'error');
    }
  }

  /** Descarga el PDF de una cotización del historial */
  async function downloadPDF(cot: Cotizacion) {
    if (!config || !cot.clientes) { toast('Datos insuficientes para generar el PDF', 'error'); return; }
    setDownloadingId(cot.id);
    try {
      const images = await loadPreviewImages(cot);
      const { pdf } = await import('@react-pdf/renderer');
      const CotizacionPDF = (await import('@/components/pdf/CotizacionPDF')).default;

      // Adaptar items al tipo CotizacionItemForm
      const items: CotizacionItemForm[] = cot.cotizacion_items.map(item => ({
        id: item.id,
        producto_id: item.producto_id ?? null,
        nombre_prenda: item.nombre_prenda,
        descripcion: item.descripcion ?? '',
        imagen_url: item.imagen_url,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
      }));

      const cliente: Cliente = {
        id: cot.clientes!.id,
        razon_social: cot.clientes!.razon_social,
        ruc: cot.clientes!.ruc,
        contacto: cot.clientes!.contacto,
        correo: cot.clientes!.correo,
        telefono: cot.clientes!.telefono,
      };

      const blob = await pdf(
        <CotizacionPDF
          numero={cot.numero_correlativo}
          fecha={cot.fecha}
          cliente={cliente}
          items={items}
          itemImages={images.itemImages}
          config={config}
          configImages={images.configImages}
          totalGeneral={Number(cot.total_general)}
          condicionesVenta={cot.observaciones || undefined}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion-${cot.numero_correlativo}-${cot.clientes!.razon_social.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`PDF ${cot.numero_correlativo} descargado ✓`, 'success');
    } catch (err) {
      console.error(err);
      toast('Error al generar el PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={22} style={{ color: 'var(--accent-red)' }} />
            Historial de Cotizaciones
          </h1>
          <p>Todas las cotizaciones realizadas — visualiza y descarga en PDF</p>
        </div>
      </div>

      {/* Barra de búsqueda + stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 260 }}>
          <Search />
          <input
            className="form-input"
            placeholder="Buscar por N° cotización, cliente o RUC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center',
            animation: 'scaleIn 0.4s ease',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-red)' }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>cotizaciones</div>
          </div>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center',
            animation: 'scaleIn 0.4s ease 0.1s both',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-orange)' }}>
              S/ {totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>total acumulado</div>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner" /> Cargando historial...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>{search ? 'Sin resultados' : 'No hay cotizaciones aún'}</h3>
          <p style={{ fontSize: 13 }}>
            {search ? 'Prueba con otro término de búsqueda.' : 'Crea tu primera cotización en el módulo Cotizaciones.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="stagger-children">
          {filtered.map(cot => (
            <div key={cot.id} className="historial-card">

              {/* Cabecera de la cotización */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', cursor: 'pointer', gap: 12,
                }}
                onClick={() => toggleExpand(cot.id)}
              >
                {/* Info principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  <div style={{
                    background: 'rgba(230,42,43,0.12)', borderRadius: 8,
                    padding: '8px 14px', textAlign: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>COT.</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-red)', fontSize: 15, letterSpacing: 1 }}>
                      {cot.numero_correlativo}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cot.clientes?.razon_social ?? 'Cliente desconocido'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(cot.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {cot.clientes?.ruc && ` · RUC: ${cot.clientes.ruc}`}
                    </div>
                  </div>
                </div>

                {/* Derecha: total + items + acciones + toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-orange)' }}>
                      S/ {Number(cot.total_general).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <FileText size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                      {cot.cotizacion_items.length} {cot.cotizacion_items.length === 1 ? 'prenda' : 'prendas'}
                    </div>
                  </div>

                  {/* Botones acción — detenemos la propagación */}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteCotizacion(cot.id, cot.numero_correlativo)}
                      title="Eliminar cotización"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      className="btn btn-preview btn-sm"
                      onClick={() => openPreview(cot)}
                      title="Vista previa PDF"
                      disabled={!config}
                    >
                      <Eye size={13} />
                      <span style={{ fontSize: 11 }}>Previa</span>
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => downloadPDF(cot)}
                      title="Descargar PDF"
                      disabled={!config || downloadingId === cot.id}
                    >
                      {downloadingId === cot.id ? (
                        <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      ) : (
                        <FileDown size={13} />
                      )}
                      <span style={{ fontSize: 11 }}>PDF</span>
                    </button>
                  </div>

                  <div style={{ color: 'var(--text-muted)' }}>
                    {cot.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Detalle expandido */}
              {cot.expanded && (
                <div style={{ borderTop: '1px solid var(--border-color)', animation: 'slideDown 0.25s ease' }}>

                  {/* Tabla de productos */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Imagen</th>
                          <th>Prenda</th>
                          <th>Descripción / Características</th>
                          <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                          <th style={{ textAlign: 'center' }}>Cant.</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cot.cotizacion_items.map(item => (
                          <tr key={item.id}>
                            <td>
                              {item.imagen_url ? (
                                <Image
                                  src={item.imagen_url}
                                  alt={item.nombre_prenda}
                                  width={52}
                                  height={52}
                                  style={{ borderRadius: 6, objectFit: 'cover' }}
                                  unoptimized
                                />
                              ) : (
                                <div style={{
                                  width: 52, height: 52, borderRadius: 6,
                                  background: 'var(--bg-elevated)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 22,
                                }}>🧥</div>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nombre_prenda}</span>
                            </td>
                            <td style={{ maxWidth: 320 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                                {item.descripcion ?? '—'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-orange)' }}>
                              S/ {Number(item.precio_unitario).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                background: 'rgba(230,42,43,0.1)', color: 'var(--accent-red)',
                                borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13,
                              }}>
                                {item.cantidad}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                              S/ {(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer expandido */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 20px', background: 'var(--bg-elevated)', gap: 16, flexWrap: 'wrap',
                  }}>
                    {cot.observaciones ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Condiciones: </span>
                        {cot.observaciones}
                      </div>
                    ) : <div />}
                    <div style={{
                      background: 'var(--accent-red)', borderRadius: 8,
                      padding: '8px 20px', textAlign: 'right', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>TOTAL GENERAL</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                        S/ {Number(cot.total_general).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL VISTA PREVIA ── */}
      {previewModal && config && (
        <div className="modal-overlay" onClick={() => setPreviewModal(null)}>
          <div className="modal modal-full" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                  Vista Previa — Cotización N° {previewModal.cot.numero_correlativo}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {previewModal.cot.clientes?.razon_social} · {previewModal.cot.cotizacion_items.length} producto{previewModal.cot.cotizacion_items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-success btn-sm"
                  disabled={previewModal.state.loading || downloadingId === previewModal.cot.id}
                  onClick={() => downloadPDF(previewModal.cot)}
                >
                  <FileDown size={13} />
                  Descargar PDF
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewModal(null)}>✕ Cerrar</button>
              </div>
            </div>
            <div style={{ padding: 0 }} className="pdf-preview-container">
              {previewModal.state.loading || !previewModal.state.images ? (
                <div style={{ height: 580, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                  <div className="spinner" /> Preparando vista previa...
                </div>
              ) : (() => {
                const items: CotizacionItemForm[] = previewModal.cot.cotizacion_items.map(item => ({
                  id: item.id,
                  producto_id: item.producto_id ?? null,
                  nombre_prenda: item.nombre_prenda,
                  descripcion: item.descripcion ?? '',
                  imagen_url: item.imagen_url,
                  precio_unitario: item.precio_unitario,
                  cantidad: item.cantidad,
                }));
                const cliente: Cliente = {
                  id: previewModal.cot.clientes!.id,
                  razon_social: previewModal.cot.clientes!.razon_social,
                  ruc: previewModal.cot.clientes!.ruc,
                  contacto: previewModal.cot.clientes!.contacto,
                  correo: previewModal.cot.clientes!.correo,
                  telefono: previewModal.cot.clientes!.telefono,
                };
                return (
                  <PDFPreview
                    numero={previewModal.cot.numero_correlativo}
                    fecha={previewModal.cot.fecha}
                    cliente={cliente}
                    items={items}
                    itemImages={previewModal.state.images.itemImages}
                    config={config}
                    configImages={previewModal.state.images.configImages}
                    totalGeneral={Number(previewModal.cot.total_general)}
                    condicionesVenta={previewModal.cot.observaciones || undefined}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
