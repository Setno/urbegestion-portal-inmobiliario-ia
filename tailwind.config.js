/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index-02.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      colors: {
        urbe: {
          dark: '#0d1b1e',      // Slate obsidian
          primary: 'var(--color-urbe-primary, #164e63)',   // Dynamic Deep Ocean Cyan/Teal
          primaryDark: 'var(--color-urbe-primary-dark, #0f3a4b)',
          accent: 'var(--color-urbe-accent, #c59b27)',    // Dynamic Luxury Gold / Accent
          accentHover: 'var(--color-urbe-accent-hover, #b0881e)',
          light: '#f8fafc',
          muted: '#64748b',
          card: '#ffffff',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Lato', 'Inter', 'system-ui', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
