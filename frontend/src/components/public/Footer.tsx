import { useEffect, useState } from 'react';
import { publicApi } from '../../lib/api';

export default function Footer() {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    publicApi.getConfig().then(setConfig);
  }, []);

  return (
    <footer id="contacto" className="bg-brand-surface border-t border-brand-border py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <span className="font-display text-xl font-bold text-white">
            {config.business_name || 'NebulosaHair'}
          </span>
          <p className="text-brand-muted text-sm mt-2">Tu estilo, nuestra pasión.</p>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Navegación</h4>
          <ul className="space-y-2">
            {['Inicio', 'Servicios', 'Galería', 'Agenda', 'Ubicación'].map(label => (
              <li key={label}>
                <a
                  href={`#${label.toLowerCase().replace('ó', 'o')}`}
                  className="text-brand-muted text-sm hover:text-white transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Contacto</h4>
          {config.whatsapp_number && (
            <a
              href={`https://wa.me/${config.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-brand-muted text-sm hover:text-white transition-colors mb-2"
            >
              <span>📱</span> {config.whatsapp_number}
            </a>
          )}
          {config.instagram_url && (
            <a
              href={config.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-brand-muted text-sm hover:text-white transition-colors mb-2"
            >
              <span>📸</span> @nebulosahair.cl
            </a>
          )}
          {config.address && (
            <p className="flex items-start gap-2 text-brand-muted text-sm">
              <span>📍</span> {config.address}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-brand-border text-center">
        <p className="text-brand-muted text-xs">© 2025 {config.business_name || 'NebulosaHair'}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
