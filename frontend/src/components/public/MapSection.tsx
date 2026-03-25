import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../../lib/api';
import { motion } from 'framer-motion';

export default function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    publicApi.getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (!config || !mapRef.current) return;

    const lat = config.address_lat || -33.5167;
    const lng = config.address_lng || -70.5972;

    // Dynamically import leaflet (SSR safe — CSS is loaded in PublicLayout)
    import('leaflet').then(L => {
      if (mapInstanceRef.current) return; // ya inicializado

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([lat, lng], 16);
      mapInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>NebulosHair</b><br>${config.address}`)
        .openPopup();
    });
  }, [config]);

  return (
    <section id="ubicacion" className="py-24 px-4 bg-brand-bg">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-3">Ubicación</h2>
          <p className="text-brand-muted">{config?.address || 'Paso El Roble 50, La Florida, Santiago'}</p>
        </motion.div>

        <div
          ref={mapRef}
          className="w-full h-80 rounded-2xl overflow-hidden border border-brand-border"
        />
      </div>
    </section>
  );
}
