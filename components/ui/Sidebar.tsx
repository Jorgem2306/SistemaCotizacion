'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, FileText, Settings, Clock, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/productos',    label: 'Productos',     icon: Package },
  { href: '/clientes',     label: 'Clientes',      icon: Users },
  { href: '/cotizaciones', label: 'Cotizaciones',  icon: FileText },
  { href: '/historial',    label: 'Historial',     icon: Clock },
  { href: '/configuracion',label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [logo, setLogo] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    supabase.from('configuracion').select('logo_principal_url').limit(1).single()
      .then(({ data }) => {
        if (data?.logo_principal_url) setLogo(data.logo_principal_url);
      });
      
    // Inicializar tema
    const saved = localStorage.getItem('dimatex_theme') || 'light';
    setTheme(saved as 'light' | 'dark');
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('dimatex_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {logo ? (
          <img src={logo} alt="DIMATEX" style={{ width: '100%', height: 75, objectFit: 'contain', marginBottom: 16 }} />
        ) : (
          <div className="logo-icon">🧵</div>
        )}
        <h2>DIMATEX PERU</h2>
        <p>Sistema de Cotizaciones</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Menú Principal</div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          {theme === 'light' ? <><Moon size={14} style={{ marginRight: 6 }}/> Modo Oscuro</> : <><Sun size={14} style={{ marginRight: 6 }}/> Modo Claro</>}
        </button>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.05em' }}>
          DIMATEX PERU © 2025
        </div>
      </div>
    </aside>
  );
}
