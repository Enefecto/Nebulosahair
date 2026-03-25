import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { publicApi } from '../../lib/api';
import { formatPrice, CATEGORY_LABELS } from '../../lib/utils';

export default function ServicesSection() {
  const [services, setServices] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    publicApi.getServices().then((data: any) => setServices(data));
  }, []);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];
  const filtered = activeCategory === 'all' ? services : services.filter(s => s.category === activeCategory);

  return (
    <section id="servicios" className="py-24 px-4 bg-brand-surface">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-3">Servicios</h2>
          <p className="text-brand-muted">Calidad y cuidado en cada servicio</p>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-pink text-white'
                  : 'border border-brand-border text-brand-muted hover:border-brand-pink hover:text-white'
              }`}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden cursor-default transition-shadow hover:shadow-xl hover:shadow-brand-pink/10"
            >
              {svc.image_url && (
                <img
                  src={svc.image_url}
                  alt={svc.name}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-5">
                <span className="text-xs text-brand-pink font-medium uppercase tracking-wide">
                  {CATEGORY_LABELS[svc.category] || svc.category}
                </span>
                <h3 className="text-white font-semibold text-lg mt-1 mb-1">{svc.name}</h3>
                {svc.description && (
                  <p className="text-brand-muted text-sm mb-3 line-clamp-2">{svc.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-brand-pink font-bold text-xl">{formatPrice(svc.price)}</span>
                  <span className="text-brand-muted text-xs">{svc.duration_minutes} min</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
