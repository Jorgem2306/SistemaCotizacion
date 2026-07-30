'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Cliente, Producto, CotizacionItemForm, Configuracion } from '@/types';
import { ToastContainer, toast } from '@/components/ui/Toast';
import {
  Search, Plus, Trash2, Package, User, Eye, RefreshCw,
} from 'lucide-react';
import PDFButton from '@/components/pdf/PDFButton';
import Image from 'next/image';
import dynamicImport from 'next/dynamic';

const PDFPreview = dynamicImport(() => import('@/components/pdf/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 620, display:'flex', alignItems:'center', justifyContent:'center', background:'#1f1f27', color:'#9999b3', borderRadius:'0 0 12px 12px' }}>
      <div className="spinner" />
    </div>
  ),
});






export default function CotizacionesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [config, setConfig] = useState<Configuracion | null>(null);

  // Formulario cotización
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteDropdown, setClienteDropdown] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [condicionesVenta, setCondicionesVenta] = useState('');
  const [items, setItems] = useState<CotizacionItemForm[]>([]);
  const [precios, setPrecios] = useState<Record<string, number>>({}); // producto_id → precio especial

  // Selector de producto
  const [prodSearch, setProdSearch] = useState('');
  const [prodDropdown, setProdDropdown] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewImages, setPreviewImages] = useState<{
    itemImages: Record<string, string>;
    configImages: { logoPrincipal?: string; logoSecundario?: string; firma?: string; logosPie?: string[]; };
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [savedId, setSavedId] = useState<string | null>(null); // para evitar doble guardado


  const dropdownRef = useRef<HTMLDivElement>(null);
  const prodDropRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: c }, { data: p }, { data: cfg }] = await Promise.all([
      supabase.from('clientes').select('*').order('razon_social'),
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('configuracion').select('*').limit(1).single(),
    ]);
    setClientes(c ?? []);
    setProductos(p ?? []);
    setConfig(cfg ?? null);
    await fetchNumero();
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fetchNumero() {
    const { data } = await supabase
      .from('cotizaciones')
      .select('numero_correlativo')
      .order('created_at', { ascending: false })
      .limit(1);
    const last = data?.[0]?.numero_correlativo;
    const next = last ? String(Number(last) + 1).padStart(6, '0') : '000001';
    setNumero(next);
  }

  async function loadPreciosEspeciales(clienteId: string) {
    const { data } = await supabase
      .from('precios_especiales')
      .select('producto_id, precio_personalizado')
      .eq('cliente_id', clienteId);
    const map: Record<string, number> = {};
    (data ?? []).forEach(pe => { map[pe.producto_id] = pe.precio_personalizado; });
    setPrecios(map);
  }

  function selectCliente(c: Cliente) {
    setSelectedCliente(c);
    setClienteSearch(c.razon_social);
    setClienteDropdown(false);
    loadPreciosEspeciales(c.id);
    // Actualizar precios de items ya agregados
    setItems(prev => prev.map(item => {
      if (item.producto_id) {
        // Se actualizarán tras cargar precios
      }
      return item;
    }));
  }

  function addProduct(p: Producto) {
    const precio = precios[p.id] ?? p.precio_base;
    const newItem: CotizacionItemForm = {
      id: `${Date.now()}-${Math.random()}`,
      producto_id: p.id,
      nombre_prenda: p.nombre,
      descripcion: p.descripcion ?? '',
      imagen_url: p.imagen_url,
      precio_unitario: precio,
      cantidad: 1,
    };
    setItems(prev => [...prev, newItem]);
    setProdSearch('');
    setProdDropdown(false);
  }

  function updateItem(id: string, field: keyof CotizacionItemForm, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const totalGeneral = items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

  const clientesFiltrados = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (c.ruc ?? '').includes(clienteSearch)
  ).slice(0, 25);

  const prodsFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(prodSearch.toLowerCase())
  ).slice(0, 25);

  /** Convierte imágenes y abre la vista previa */
  async function openPreview() {
    if (!selectedCliente || items.length === 0 || !config) return;
    setLoadingPreview(true);
    setShowPreview(true);
    try {
      const { urlToBase64 } = await import('@/lib/storage');
      const itemImages: Record<string, string> = {};
      for (const item of items) {
        if (item.imagen_url) {
          const b64 = await urlToBase64(item.imagen_url);
          if (b64) itemImages[item.producto_id ?? item.id] = b64;
        }
      }
      const configImages: { logoPrincipal?: string; logoSecundario?: string; firma?: string; logosPie?: string[] } = {};
      if (config.logo_principal_url)  configImages.logoPrincipal  = (await urlToBase64(config.logo_principal_url))  || undefined;
      if (config.logo_secundario_url) configImages.logoSecundario = (await urlToBase64(config.logo_secundario_url)) || undefined;
      if (config.firma_url)           configImages.firma           = (await urlToBase64(config.firma_url))           || undefined;
      if (config.logos_pie_urls?.length) {
        configImages.logosPie = await Promise.all(config.logos_pie_urls.map(u => urlToBase64(u)));
      }
      setPreviewImages({ itemImages, configImages });
    } finally {
      setLoadingPreview(false);
    }
  }

  /** Guarda la cotización — devuelve true si tuvo éxito, false si ya estaba guardada o falló */
  async function autoSaveCotizacion(): Promise<boolean> {
    if (savedId) return true; // ya guardada, no duplicar
    if (!selectedCliente || items.length === 0) {
      toast('Selecciona un cliente y agrega productos primero', 'error');
      return false;
    }
    try {
      const { data: cot, error } = await supabase
        .from('cotizaciones')
        .insert({
          numero_correlativo: numero,
          cliente_id: selectedCliente.id,
          fecha,
          total_general: totalGeneral,
          observaciones: observaciones.trim() || null,
        })
        .select().single();
      if (error) throw error;

      const itemsPayload = items.map((item, idx) => ({
        cotizacion_id: cot.id,
        producto_id: item.producto_id,
        nombre_prenda: item.nombre_prenda,
        descripcion: item.descripcion || null,
        imagen_url: item.imagen_url,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
        orden: idx,
      }));
      const { error: itemErr } = await supabase.from('cotizacion_items').insert(itemsPayload);
      if (itemErr) throw itemErr;

      setSavedId(cot.id);
      toast(`Cotización ${numero} guardada ✓`, 'success');
      return true;
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al guardar', 'error');
      return false;
    }
  }


  return (
    <>
      <ToastContainer />

      <div className="page-header">
        <h1>Generador de Cotizaciones</h1>
        <p>Crea cotizaciones con precios especiales por cliente y descarga en PDF</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* ─── FORMULARIO PRINCIPAL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cabecera cotización */}
          <div className="card">
            <div className="card-header"><h2>Datos de la Cotización</h2></div>
            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Número Correlativo</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="form-input"
                      value={numero}
                      onChange={e => setNumero(e.target.value)}
                      style={{ fontWeight: 700, letterSpacing: 2 }}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={fetchNumero}
                      title="Regenerar correlativo"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    className="form-input"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                  />
                </div>
              </div>

              {/* Selector de cliente */}
              <div className="form-group">
                <label className="form-label">
                  <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Cliente
                </label>
                <div className="autocomplete-wrapper" ref={dropdownRef}>
                  <input
                    className="form-input"
                    placeholder="Buscar cliente por nombre o RUC..."
                    value={clienteSearch}
                    onChange={e => {
                      setClienteSearch(e.target.value);
                      setClienteDropdown(true);
                      if (!e.target.value) setSelectedCliente(null);
                    }}
                    onFocus={() => setClienteDropdown(true)}
                  />
                  {clienteDropdown && clienteSearch && clientesFiltrados.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {clientesFiltrados.map(c => (
                        <div
                          key={c.id}
                          className="autocomplete-item"
                          onMouseDown={() => selectCliente(c)}
                        >
                          <div className="ac-primary">{c.razon_social}</div>
                          <div className="ac-secondary">RUC: {c.ruc ?? '—'} · {c.contacto ?? ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Datos autocompletados del cliente */}
              {selectedCliente && (
                <div style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                }}>
                  {[
                    ['RUC', selectedCliente.ruc],
                    ['Contacto', selectedCliente.contacto],
                    ['Correo', selectedCliente.correo],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{val ?? '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selector de productos */}
          <div className="card">
            <div className="card-header">
              <h2>Agregar Productos</h2>
            </div>
            <div className="card-body">
              <div className="autocomplete-wrapper" ref={prodDropRef}>
                <div className="search-bar">
                  <Search />
                  <input
                    className="form-input"
                    placeholder="Buscar prenda para agregar..."
                    value={prodSearch}
                    onChange={e => {
                      setProdSearch(e.target.value);
                      setProdDropdown(true);
                    }}
                    onFocus={() => setProdDropdown(true)}
                    onBlur={() => setTimeout(() => setProdDropdown(false), 150)}
                  />
                </div>
                {prodDropdown && prodSearch && prodsFiltrados.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {prodsFiltrados.map(p => {
                      const precioEspecial = selectedCliente ? precios[p.id] : undefined;
                      return (
                        <div
                          key={p.id}
                          className="autocomplete-item"
                          onMouseDown={() => addProduct(p)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                          {p.imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imagen_url} alt={p.nombre}
                              style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: 4,
                              background: 'var(--bg-elevated)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 16, flexShrink: 0,
                            }}>🧥</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div className="ac-primary">{p.nombre}</div>
                            <div className="ac-secondary" style={{ display: 'flex', gap: 8 }}>
                              <span>Base: S/ {Number(p.precio_base).toFixed(2)}</span>
                              {precioEspecial !== undefined && (
                                <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                                  ★ Especial: S/ {precioEspecial.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Plus size={14} color="var(--accent-blue)" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de ítems */}
          {items.length > 0 && (
            <div className="card">
              <div className="card-header"><h2>Detalle de la Cotización</h2></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}></th>
                      <th>Prenda</th>
                      <th style={{ width: 420 }}>Descripción</th>
                      <th style={{ width: 130 }}>Precio Unit.</th>
                      <th style={{ width: 90 }}>Cantidad</th>
                      <th style={{ width: 110 }}>Total</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                          {item.imagen_url ? (
                            <Image
                              src={item.imagen_url}
                              alt={item.nombre_prenda}
                              width={52}
                              height={52}
                              unoptimized
                              style={{ borderRadius: 6, objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{
                              width: 52, height: 52, borderRadius: 6,
                              background: 'var(--bg-elevated)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Package size={22} color="var(--text-muted)" />
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.nombre_prenda}</td>
                        <td>
                          <textarea
                            className="form-input"
                            value={item.descripcion}
                            onChange={e => updateItem(item.id, 'descripcion', e.target.value)}
                            rows={1}
                            style={{
                              fontSize: 12,
                              resize: 'none',
                              overflow: 'hidden',
                              minHeight: 'unset',
                              lineHeight: '1.5',
                              paddingTop: 8,
                              paddingBottom: 8,
                            }}
                            ref={el => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                            onInput={e => {
                              const t = e.currentTarget;
                              t.style.height = 'auto';
                              t.style.height = t.scrollHeight + 'px';
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className="form-input"
                            type="number" min="0" step="0.01"
                            value={item.precio_unitario}
                            onChange={e => updateItem(item.id, 'precio_unitario', Number(e.target.value))}
                            style={{ textAlign: 'right', fontWeight: 600 }}
                          />
                          {item.producto_id && precios[item.producto_id] !== undefined && (
                            <div style={{ fontSize: 10, color: 'var(--accent-amber)', marginTop: 2 }}>
                              ★ Precio especial
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            className="form-input"
                            type="number" min="1"
                            value={item.cantidad}
                            onChange={e => updateItem(item.id, 'cantidad', Number(e.target.value))}
                            style={{ textAlign: 'center' }}
                          />
                        </td>
                        <td>
                          <span className="price-display">
                            S/ {(item.precio_unitario * item.cantidad).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div style={{ padding: '16px 20px' }}>
                <div className="total-bar">
                  <div>
                    <div className="total-label">Total de la Cotización</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                    </div>
                  </div>
                  <div className="total-value">
                    S/ {totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Condiciones de Venta editables */}
          <div className="card">
            <div className="card-header"><h2>Condiciones de Venta</h2></div>
            <div className="card-body">
              <textarea
                className="form-input"
                value={condicionesVenta}
                onChange={e => setCondicionesVenta(e.target.value)}
                placeholder="Ej: 50% adelanto, 50% contra entrega. Tiempo de entrega: 15 días hábiles..."
                rows={5}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Estas condiciones aparecerán en el PDF de la cotización. Si se deja vacío, se usarán las condiciones predeterminadas de Configuración.
              </p>
            </div>
          </div>
        </div>

        {/* ─── PANEL DERECHO: ACCIONES ─── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Resumen */}
          <div className="card">
            <div className="card-header"><h2>Resumen</h2></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cotización N°</span>
                <span style={{ fontWeight: 700, letterSpacing: 2, color: 'var(--accent-blue)' }}>{numero}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cliente</span>
                <span style={{ fontWeight: 600, fontSize: 13, textAlign: 'right', maxWidth: 180, color: 'var(--text-primary)' }}>
                  {selectedCliente?.razon_social ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ítems</span>
                <span style={{ fontWeight: 600 }}>{items.length}</span>
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-orange)' }}>
                  S/ {totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="card">
            <div className="card-header"><h2>Acciones</h2></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Vista previa */}
              <button
                className="btn btn-preview btn-lg"
                onClick={openPreview}
                disabled={!selectedCliente || items.length === 0 || !config || loadingPreview}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Eye size={16} style={{ marginRight: 6 }} />
                {loadingPreview ? 'Cargando...' : 'Vista Previa PDF'}
              </button>

              {/* Botón generar + descargar PDF (auto-guarda) */}
              {selectedCliente && items.length > 0 && config ? (
                <PDFButton
                  numero={numero}
                  fecha={fecha}
                  cliente={selectedCliente}
                  items={items}
                  config={config}
                  totalGeneral={totalGeneral}
                  condicionesVenta={condicionesVenta || undefined}
                  fileName={`Cotizacion-${numero}-${selectedCliente.razon_social.replace(/\s/g, '_')}.pdf`}
                  onAutoSave={autoSaveCotizacion}
                />
              ) : (
                <button
                  className="btn btn-success btn-lg"
                  disabled
                  style={{ width: '100%', justifyContent: 'center', opacity: 0.5 }}
                >
                  ⬇ Generar y Descargar PDF
                </button>
              )}
            </div>
          </div>

          {/* Ayuda precios */}
          {selectedCliente && (
            <div style={{
              background: 'rgba(236,105,53,0.08)',
              border: '1px solid rgba(236,105,53,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px', fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-orange)', marginBottom: 6 }}>
                ★ Precios especiales activos
              </div>
              Los productos marcados con ★ usarán el precio especial configurado para{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{selectedCliente.razon_social}</strong>.
              Puedes editar el precio manualmente en la tabla.
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL VISTA PREVIA ── */}
      {showPreview && selectedCliente && config && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal modal-full" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Vista Previa — Cotización N° {numero}</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedCliente.razon_social} · {items.length} producto{items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview(false)}>✕ Cerrar</button>
            </div>
            <div style={{ padding: 0 }} className="pdf-preview-container">
              {previewImages ? (
                <PDFPreview
                  numero={numero}
                  fecha={fecha}
                  cliente={selectedCliente}
                  items={items}
                  itemImages={previewImages.itemImages}
                  config={config}
                  configImages={previewImages.configImages}
                  totalGeneral={totalGeneral}
                  condicionesVenta={condicionesVenta || undefined}
                />
              ) : (
                <div style={{ height: 620, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
                  <div className="spinner" /> Preparando vista previa...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
