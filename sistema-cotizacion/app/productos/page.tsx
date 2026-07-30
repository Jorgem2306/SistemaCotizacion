'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Producto } from '@/types';
import { deleteFile } from '@/lib/storage';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ui/ImageUpload';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: '', descripcion: '', imagen_url: '', precio_base: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('nombre');
    setProductos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '', imagen_url: '', precio_base: '' });
    setModalOpen(true);
  }

  function openEdit(p: Producto) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      imagen_url: p.imagen_url ?? '',
      precio_base: String(p.precio_base),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return toast('El nombre es requerido', 'error');
    if (!form.precio_base || isNaN(Number(form.precio_base))) return toast('Precio base inválido', 'error');

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        imagen_url: form.imagen_url || null,
        precio_base: Number(form.precio_base),
      };

      if (editing) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast('Producto actualizado', 'success');
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) throw error;
        toast('Producto creado', 'success');
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Producto) {
    try {
      if (p.imagen_url) await deleteFile(p.imagen_url);
      const { error } = await supabase.from('productos').delete().eq('id', p.id);
      if (error) throw error;
      toast('Producto eliminado', 'success');
      setConfirmDelete(null);
      await load();
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al eliminar', 'error');
    }
  }

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ToastContainer />

      <div className="page-header">
        <h1>Catálogo de Productos</h1>
        <p>Gestiona las prendas y su información</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ width: 280 }}>
            <Search />
            <input
              className="form-input"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>

        <div style={{ overflow: 'auto' }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /> Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧥</div>
              <h3>Sin productos</h3>
              <p>{search ? 'Sin resultados para tu búsqueda' : 'Agrega tu primer producto'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio Base</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen_url} alt={p.nombre} className="product-thumb" />
                      ) : (
                        <div className="product-thumb-placeholder"><Package size={20} /></div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{
                        fontSize: 12, color: 'var(--text-muted)',
                        whiteSpace: 'pre-line',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {p.descripcion ?? '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                        S/ {Number(p.precio_base).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(p)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando...</> : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre de la prenda *</label>
          <input
            className="form-input"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Polo Corporativo"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción / Características</label>
          <textarea
            className="form-input"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder={"• Tela 100% algodón 30/1\n• Cuello redondo reforzado\n• Tallas S-M-L-XL-XXL"}
            rows={5}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Usa viñetas (•) y saltos de línea para el formato del PDF
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Precio Base (S/) *</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            value={form.precio_base}
            onChange={e => setForm(f => ({ ...f, precio_base: e.target.value }))}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Imagen de la prenda</label>
          <ImageUpload
            currentUrl={form.imagen_url || null}
            onUpload={url => setForm(f => ({ ...f, imagen_url: url }))}
            folder="productos"
          />
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmar Eliminación"
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
          ¿Seguro que deseas eliminar <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
}

