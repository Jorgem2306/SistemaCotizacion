'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ToastContainer } from '@/components/ui/Toast';
import { Package, Users, FileText, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  productos: number;
  clientes: number;
  cotizaciones: number;
  totalMes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ productos: 0, clientes: 0, cotizaciones: 0, totalMes: 0 });
  const [loading, setLoading] = useState(true);
  const [recentCotizaciones, setRecentCotizaciones] = useState<Array<{
    id: string; numero_correlativo: string; fecha: string; total_general: number;
    clientes: { razon_social: string } | null;
  }>>([]);

  useEffect(() => {
    async function load() {
      try {
        const [prod, cli, cot, recent] = await Promise.all([
          supabase.from('productos').select('id', { count: 'exact', head: true }),
          supabase.from('clientes').select('id', { count: 'exact', head: true }),
          supabase.from('cotizaciones').select('total_general'),
          supabase
            .from('cotizaciones')
            .select('id, numero_correlativo, fecha, total_general, clientes(razon_social)')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const thisMonth = new Date();
        thisMonth.setDate(1);
        const totalMes = (cot.data ?? [])
          .reduce((sum, c) => sum + Number(c.total_general), 0);

        setStats({
          productos: prod.count ?? 0,
          clientes: cli.count ?? 0,
          cotizaciones: cot.data?.length ?? 0,
          totalMes,
        });
        setRecentCotizaciones((recent.data as unknown as typeof recentCotizaciones) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    {
      label: 'Productos', value: stats.productos, icon: '🧥',
      color: 'var(--accent-red)', href: '/productos',
      gradient: 'linear-gradient(90deg, var(--accent-red), var(--accent-orange))',
    },
    {
      label: 'Clientes', value: stats.clientes, icon: '👥',
      color: 'var(--accent-orange)', href: '/clientes',
      gradient: 'linear-gradient(90deg, var(--accent-orange), #c0511f)',
    },
    {
      label: 'Cotizaciones', value: stats.cotizaciones, icon: '📋',
      color: 'var(--accent-yellow)', href: '/cotizaciones',
      gradient: 'linear-gradient(90deg, var(--accent-yellow), #d4a800)',
    },
  ];

  return (
    <>
      <ToastContainer />
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bienvenido al Sistema de Cotizaciones DIMATEX PERU</p>
      </div>

      {/* Stats */}
      <div className="grid-3 stagger-children" style={{ marginBottom: 28 }}>
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ '--gradient-line': s.gradient } as React.CSSProperties}>
              <div className="stat-icon" style={{ background: `${s.color}22`, fontSize: 22 }}>
                {s.icon}
              </div>
              {loading ? (
                <div style={{ height: 36, background: 'var(--border-color)', borderRadius: 6, animation: 'pulse 1s infinite' }} />
              ) : (
                <div className="stat-value">{s.value}</div>
              )}
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Accesos Rápidos + Cotizaciones Recientes */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Accesos rápidos */}
        <div className="card">
          <div className="card-header">
            <h2>Acceso Rápido</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { href: '/cotizaciones', label: 'Nueva Cotización', desc: 'Generar y descargar PDF', icon: <FileText size={18} />, primary: true },
              { href: '/productos', label: 'Agregar Producto', desc: 'Catálogo de prendas', icon: <Package size={18} />, primary: false },
              { href: '/clientes', label: 'Registrar Cliente', desc: 'Gestión y tarifario', icon: <Users size={18} />, primary: false },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: item.primary ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${item.primary ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 38, height: 38,
                  background: item.primary ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.primary ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>

        {/* Cotizaciones recientes */}
        <div className="card">
          <div className="card-header">
            <h2>Cotizaciones Recientes</h2>
            <Link href="/historial" className="btn btn-secondary btn-sm">Ver todas</Link>
          </div>
          <div style={{ overflow: 'hidden' }}>
            {loading ? (
              <div className="loading-overlay"><div className="spinner" /> Cargando...</div>
            ) : recentCotizaciones.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Sin cotizaciones</h3>
                <p>Crea tu primera cotización</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCotizaciones.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-blue">{c.numero_correlativo}</span></td>
                      <td style={{ fontSize: 13 }}>{c.clientes?.razon_social ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(c.fecha).toLocaleDateString('es-PE')}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>
                        S/ {Number(c.total_general).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
