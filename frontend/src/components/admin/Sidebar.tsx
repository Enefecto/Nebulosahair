import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { publicApi } from '../../lib/api';

const NAV_ITEMS = [
  { href: '/admin-nh-7x9k2m/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin-nh-7x9k2m/services', label: 'Servicios', icon: '✂️' },
  { href: '/admin-nh-7x9k2m/appointments', label: 'Agenda', icon: '📅' },
  { href: '/admin-nh-7x9k2m/gallery', label: 'Galería', icon: '🖼️' },
  { href: '/admin-nh-7x9k2m/schedule', label: 'Horarios', icon: '🕐' },
  { href: '/admin-nh-7x9k2m/config', label: 'Configuración', icon: '⚙️' },
];

interface Props {
  activeSection: string;
}

export default function Sidebar({ activeSection }: Props) {
  const { user, logout } = useAuth();
  const [businessName, setBusinessName] = useState('NebulosaHair');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    publicApi.getConfig().then((c: any) => { if (c.business_name) setBusinessName(c.business_name); }).catch(() => {});
  }, []);

  // Cerrar sidebar al cambiar de tamaño a desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const nav = (
    <>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <span className="font-display text-xl font-bold text-brand-pink">{businessName}</span>
          <p className="text-xs text-gray-500 mt-0.5">Panel de Gestión</p>
        </div>
        {/* Botón cerrar en móvil */}
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === item.label
                ? 'bg-pink-50 text-brand-pink'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate mb-2">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full text-left text-sm text-gray-600 hover:text-red-500 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botón hamburger — solo móvil */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay móvil */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar desktop (siempre visible) + móvil (slide-in) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {nav}
      </aside>
    </>
  );
}
