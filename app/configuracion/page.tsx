'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Configuracion } from '@/types';
import { uploadFile } from '@/lib/storage';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { Save, Upload, X } from 'lucide-react';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [configId, setConfigId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    emisor_nombre: '',
    emisor_cargo: '',
    empresa_ruc: '',
    empresa_direccion: '',
    empresa_telefono: '',
    empresa_correo: '',
    condiciones_venta: '',
  });

  const [logos, setLogos] = useState({
    logo_principal_url: '',
    logo_secundario_url: '',
    firma_url: '',
  });

  const [logosPie, setLogosPie] = useState<string[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('configuracion').select('*').limit(1).single();
    if (data) {
      setConfig(data as Configuracion);
      setConfigId(data.id);
      setForm({
        emisor_nombre: data.emisor_nombre ?? '',
        emisor_cargo: data.emisor_cargo ?? '',
        empresa_ruc: data.empresa_ruc ?? '',
        empresa_direccion: data.empresa_direccion ?? '',
        empresa_telefono: data.empresa_telefono ?? '',
        empresa_correo: data.empresa_correo ?? '',
        condiciones_venta: data.condiciones_venta ?? '',
      });
      setLogos({
        logo_principal_url: data.logo_principal_url ?? '',
        logo_secundario_url: data.logo_secundario_url ?? '',
        firma_url: data.firma_url ?? '',
      });
      setLogosPie(data.logos_pie_urls ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUploadLogo(field: keyof typeof logos, folder: 'logos' | 'firmas', file: File) {
    setUploading(u => ({ ...u, [field]: true }));
    try {
      const url = await uploadFile(file, folder);
      setLogos(l => ({ ...l, [field]: url }));
      toast('Imagen subida', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Error', 'error');
    } finally {
      setUploading(u => ({ ...u, [field]: false }));
    }
  }

  async function handleUploadLogoPie(file: File) {
    setUploading(u => ({ ...u, logoPie: true }));
    try {
      const url = await uploadFile(file, 'logos');
      setLogosPie(prev => [...prev, url]);
      toast('Logo pie agregado', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Error', 'error');
    } finally {
      setUploading(u => ({ ...u, logoPie: false }));
    }
  }

  async function handleSave() {
    if (!configId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('configuracion').update({
        ...form,
        ...logos,
        logos_pie_urls: logosPie,
        updated_at: new Date().toISOString(),
      }).eq('id', configId);
      if (error) throw error;
      toast('Configuración guardada correctamente', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="loading-overlay"><div className="spinner" /> Cargando configuración...</div>
  );

  function LogoUploadBox({
    label, field, folder, value,
  }: {
    label: string;
    field: keyof typeof logos;
    folder: 'logos' | 'firmas';
    value: string;
  }) {
    return (
      <div>
        <label className="form-label">{label}</label>
        <label
          style={{
            display: 'block',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <input
            type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUploadLogo(field, folder, file);
            }}
          />
          {value ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt={label} style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {uploading[field] ? 'Subiendo...' : 'Clic para cambiar'}
              </span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {uploading[field] ? <div className="spinner" style={{ margin: '0 auto' }} /> : (
                <><Upload size={24} style={{ margin: '0 auto 6px' }} /><div>Subir {label}</div></>
              )}
            </div>
          )}
        </label>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Personaliza logos, firma, datos de empresa y condiciones de venta para el PDF</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Guardando...</> : <><Save size={16} /> Guardar Todo</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ─── LOGOS ─── */}
        <div className="card">
          <div className="card-header"><h2>🖼️ Logos del PDF</h2></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LogoUploadBox label="Logo Principal (encabezado izquierdo)" field="logo_principal_url" folder="logos" value={logos.logo_principal_url} />
            <LogoUploadBox label="Logo Secundario (encabezado derecho)" field="logo_secundario_url" folder="logos" value={logos.logo_secundario_url} />
            <LogoUploadBox label="Firma Digitalizada" field="firma_url" folder="firmas" value={logos.firma_url} />
          </div>
        </div>

        {/* ─── DATOS EMPRESA ─── */}
        <div className="card">
          <div className="card-header"><h2>🏢 Datos de la Empresa</h2></div>
          <div className="card-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">RUC</label>
                <input className="form-input" value={form.empresa_ruc}
                  onChange={e => setForm(f => ({ ...f, empresa_ruc: e.target.value }))}
                  placeholder="20XXXXXXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={form.empresa_telefono}
                  onChange={e => setForm(f => ({ ...f, empresa_telefono: e.target.value }))}
                  placeholder="+51 999 999 999" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección Fiscal</label>
              <input className="form-input" value={form.empresa_direccion}
                onChange={e => setForm(f => ({ ...f, empresa_direccion: e.target.value }))}
                placeholder="Av. Principal 123, Lima, Perú" />
            </div>
            <div className="form-group">
              <label className="form-label">Correo de Contacto</label>
              <input className="form-input" type="email" value={form.empresa_correo}
                onChange={e => setForm(f => ({ ...f, empresa_correo: e.target.value }))}
                placeholder="ventas@empresa.com" />
            </div>
            <div className="divider" />
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nombre del Emisor (para firma)</label>
                <input className="form-input" value={form.emisor_nombre}
                  onChange={e => setForm(f => ({ ...f, emisor_nombre: e.target.value }))}
                  placeholder="Juan Pérez" />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo del Emisor</label>
                <input className="form-input" value={form.emisor_cargo}
                  onChange={e => setForm(f => ({ ...f, emisor_cargo: e.target.value }))}
                  placeholder="Gerente de Ventas" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── LOGOS DEL PIE ─── */}
        <div className="card">
          <div className="card-header"><h2>🏷️ Logos del Pie de Página</h2></div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Agrega los logos de marcas secundarias que aparecen en la franja inferior del PDF.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {logosPie.map((url, i) => (
                <div key={i} style={{
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Logo pie ${i + 1}`}
                    style={{ width: 80, height: 50, objectFit: 'contain', display: 'block', padding: 4 }} />
                  <button
                    onClick={() => setLogosPie(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: 18, height: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', padding: '8px 16px',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadLogoPie(file);
                }}
              />
              {uploading.logoPie ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Upload size={14} />}
              Agregar logo
            </label>
          </div>
        </div>

      </div>
    </>
  );
}

