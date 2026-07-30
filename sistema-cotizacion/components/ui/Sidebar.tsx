'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, FileText, Settings, Clock } from 'lucide-react';

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
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🧵</div>
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
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.05em' }}>
          DIMATEX PERU © 2025
        </div>
      </div>
    </aside>
  );
}
