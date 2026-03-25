import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#galeria', label: 'Galería' },
  { href: '#agenda', label: 'Agenda' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-brand-bg/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <a href="#inicio" className="font-display text-xl font-bold text-white">
          Nebulos<span className="text-brand-pink">Hair</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-brand-muted hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#agenda"
          className="hidden md:block bg-brand-pink text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-brand-pink-dark transition-colors"
        >
          Agenda tu hora
        </a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Menú"
        >
          <div className="w-5 h-0.5 bg-white mb-1" />
          <div className="w-5 h-0.5 bg-white mb-1" />
          <div className="w-5 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-brand-surface border-t border-brand-border px-4 py-4 space-y-3"
        >
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-brand-muted hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#agenda"
            onClick={() => setMenuOpen(false)}
            className="block bg-brand-pink text-white text-sm font-medium px-4 py-2 rounded-full text-center hover:bg-brand-pink-dark transition-colors"
          >
            Agenda tu hora
          </a>
        </motion.div>
      )}
    </nav>
  );
}
