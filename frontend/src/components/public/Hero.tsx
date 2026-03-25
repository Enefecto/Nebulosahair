import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { publicApi } from '../../lib/api';

export default function Hero() {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    publicApi.getConfig().then(setConfig).catch(() => {});
  }, []);

  const name: string = config.business_name || 'NebulosaHair';
  const split = name.length > 7 ? [name.slice(0, -4), name.slice(-4)] : [name, ''];

  return (
    <section
      id="inicio"
      className="min-h-screen flex items-center justify-center relative bg-brand-bg overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-radial from-brand-pink/10 via-transparent to-transparent pointer-events-none" />

      <div className="text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt={`${name} logo`}
              className="w-40 h-40 mx-auto mb-8 object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt={`${name} logo`}
              className="w-40 h-40 mx-auto mb-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-display text-5xl sm:text-7xl font-bold text-white mb-4"
        >
          {split[0]}<span className="text-brand-pink">{split[1]}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-brand-muted text-lg sm:text-xl mb-10 max-w-md mx-auto"
        >
          Tu estilo, nuestra pasión.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#servicios"
            className="bg-brand-surface border border-brand-border text-white px-8 py-3 rounded-full text-sm font-medium hover:border-brand-pink transition-colors"
          >
            Ver Servicios
          </a>
          <a
            href="#agenda"
            className="bg-brand-pink text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-brand-pink-dark transition-colors"
          >
            Agendar Hora
          </a>
        </motion.div>
      </div>
    </section>
  );
}
