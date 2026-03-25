import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicApi } from '../../lib/api';

export default function GallerySection() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    publicApi.getGallery()
      .then((data: any) => setImages(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // No mostrar la sección si no hay imágenes y ya terminó de cargar
  if (!loading && images.length === 0) return null;

  return (
    <section id="galeria" className="py-24 px-4 bg-brand-bg">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-3">Galería</h2>
          <p className="text-brand-muted">Trabajos que hablan por sí solos</p>
        </motion.div>

        {/* Skeleton mientras carga */}
        {loading ? (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid rounded-xl bg-brand-surface animate-pulse"
                style={{ height: `${180 + (i % 3) * 60}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => setSelected(img)}
                className="cursor-pointer rounded-xl overflow-hidden break-inside-avoid hover:opacity-90 transition-opacity"
              >
                <img
                  src={img.image_url}
                  alt={img.title || ''}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selected.image_url}
              alt={selected.title || ''}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
