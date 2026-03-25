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

  useEffect(() => {
    publicApi.getConfig().then((c: any) => { if (c.business_name) setBusinessName(c.business_name); }).catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <span className="font-display text-xl font-bold text-brand-pink">{businessName}</span>
        <p className="text-xs text-gray-500 mt-1">Panel de Gestión</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
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
    </aside>
  );
}
