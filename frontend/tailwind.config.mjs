/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Paleta NebulosHair: dark sophisticated + acentos rosa/magenta
        brand: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#1a1a1a',
          border: '#2a2a2a',
          pink: '#e879a0',      // acento principal (rosa/magenta del logo)
          'pink-soft': '#f4a7c0',
          'pink-dark': '#c4527a',
          text: '#f5f5f5',
          muted: '#888888',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
