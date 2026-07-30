'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Cliente, Producto, PrecioEspecial } from '@/types';
import Modal from '@/components/ui/Modal';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal cliente
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null);

  const [form, setForm] = useState({
    razon_social: '', ruc: '', contacto: '', correo: '', telefono: '',
  });

  // Precios especiales
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [preciosMap, setPreciosMap] = useState<Record<string, PrecioEspecial[]>>({});
  const [precioForm, setPrecioForm] = useState({ producto_id: '', precio_personalizado: '' });
  const [savingPrecio, setSavingPrecio] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clientes').select('*').order('razon_social'),
      supabase.from('productos').select('*').order('nombre'),
    ]);
    setClientes(c ?? []);
    setProductos(p ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadPrecios(clienteId: string) {
    const { data } = await supabase
      .from('precios_especiales')
      .select('*, producto:productos(id, nombre, precio_base)')
      .eq('cliente_id', clienteId);
    setPreciosMap(prev => ({ ...prev, [clienteId]: data ?? [] }));
  }

  async function toggleExpand(clienteId: string) {
    if (expandedClient === clienteId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clienteId);
      await loadPrecios(clienteId);
      setPrecioForm({ producto_id: '', precio_personalizado: '' });
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ razon_social: '', ruc: '', contacto: '', correo: '', telefono: '' });
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing(c);
    setForm({
      razon_social: c.razon_social,
      ruc: c.ruc ?? '',
      contacto: c.contacto ?? '',
      correo: c.correo ?? '',
      telefono: c.telefono ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.razon_social.trim()) return toast('La razón social es requerida', 'error');
    setSaving(true);
    try {
      const payload = {
        razon_social: form.razon_social.trim(),
        ruc: form.ruc.trim() || null,
        contacto: form.contacto.trim() || null,
        correo: form.correo.trim() || null,
        telefono: form.telefono.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast('Cliente actualizado', 'success');
      } else {
        const { error } = await supabase.from('clientes').insert(payload);
        if (error) throw error;
        toast('Cliente registrado', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Cliente) {
    const { error } = await supabase.from('clientes').delete().eq('id', c.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Cliente eliminado', 'success');
    setConfirmDelete(null);
    await load();
  }

  async function handleAddPrecio(clienteId: string) {
    if (!precioForm.producto_id) return toast('Selecciona un producto', 'error');
    if (!precioForm.precio_personalizado || isNaN(Number(precioForm.precio_personalizado))) {
      return toast('Precio inválido', 'error');
    }
    setSavingPrecio(true);
    try {
      const { error } = await supabase.from('precios_especiales').upsert({
        cliente_id: clienteId,
        producto_id: precioForm.producto_id,
        precio_personalizado: Number(precioForm.precio_personalizado),
      }, { onConflict: 'cliente_id,producto_id' });
      if (error) throw error;
      toast('Precio especial guardado', 'success');
      setPrecioForm({ producto_id: '', precio_personalizado: '' });
      await loadPrecios(clienteId);
    } catch (err: unknown) {
      toast((err as Error).message || 'Error', 'error');
    } finally {
      setSavingPrecio(false);
    }
  }

  async function handleDeletePrecio(precioId: string, clienteId: string) {
    const { error } = await supabase.from('precios_especiales').delete().eq('id', precioId);
    if (error) { toast(error.message, 'error'); return; }
    toast('Precio eliminado', 'success');
    await loadPrecios(clienteId);
  }

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    (c.ruc ?? '').includes(search)
  );

  return (
    <>
      <ToastContainer />

      <div className="page-header">
        <h1>Gestión de Clientes</h1>
        <p>Registra clientes y configura sus precios especiales por producto</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ width: 300 }}>
            <Search />
            <input
              className="form-input"
              placeholder="Buscar por razón social o RUC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>

        <div>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /> Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Sin clientes</h3>
              <p>{search ? 'Sin resultados' : 'Registra tu primer cliente'}</p>
            </div>
          ) : (
            filtered.map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {/* Fila principal */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  alignItems: 'center', padding: '14px 20px', gap: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.razon_social}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>RUC: {c.ruc ?? '—'}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.contacto ?? '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.correo ?? '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.telefono ?? '—'}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleExpand(c.id)}
                      title="Precios especiales"
                    >
                      <DollarSign size={13} />
                      {expandedClient === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(c)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Panel de precios especiales */}
                {expandedClient === c.id && (
                  <div style={{
                    background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-color)',
                    padding: '16px 20px 20px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 12 }}>
                      💰 Precios Especiales para {c.razon_social}
                    </div>

                    {/* Lista de precios */}
                    {(preciosMap[c.id] ?? []).length > 0 ? (
                      <div style={{ marginBottom: 16 }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Precio Base</th>
                              <th>Precio Especial</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(preciosMap[c.id] ?? []).map(pe => (
                              <tr key={pe.id}>
                                <td>{(pe.producto as unknown as Producto)?.nombre ?? '—'}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                  S/ {Number((pe.producto as unknown as Producto)?.precio_base ?? 0).toFixed(2)}
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                                    S/ {Number(pe.precio_personalizado).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeletePrecio(pe.id, c.id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                        Sin precios especiales configurados. Se usará el precio base de cada producto.
                      </div>
                    )}

                    {/* Formulario agregar precio */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">Producto</label>
                        <select
                          className="form-input form-select"
                          value={precioForm.producto_id}
                          onChange={e => setPrecioForm(f => ({ ...f, producto_id: e.target.value }))}
                        >
                          <option value="">Seleccionar...</option>
                          {productos.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} (Base: S/ {Number(p.precio_base).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Precio especial (S/)</label>
                        <input
                          className="form-input"
                          type="number" min="0" step="0.01"
                          value={precioForm.precio_personalizado}
                          onChange={e => setPrecioForm(f => ({ ...f, precio_personalizado: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAddPrecio(c.id)}
                        disabled={savingPrecio}
                        style={{ marginBottom: 0, height: 42 }}
                      >
                        {savingPrecio ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <><Plus size={14} /> Guardar</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal cliente */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</> : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Razón Social *</label>
            <input className="form-input" value={form.razon_social}
              onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))}
              placeholder="Empresa S.A.C." />
          </div>
          <div className="form-group">
            <label className="form-label">RUC</label>
            <input className="form-input" value={form.ruc}
              onChange={e => setForm(f => ({ ...f, ruc: e.target.value }))}
              placeholder="20XXXXXXXXX" maxLength={11} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Persona de Contacto</label>
          <input className="form-input" value={form.contacto}
            onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
            placeholder="Juan Pérez" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input className="form-input" type="email" value={form.correo}
              onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
              placeholder="correo@empresa.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="+51 999 999 999" />
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar Cliente"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Trash2 size={14} /> Eliminar
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar a <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.razon_social}</strong>?
          Se eliminarán también sus precios especiales y cotizaciones asociadas.
        </p>
      </Modal>
    </>
  );
}

