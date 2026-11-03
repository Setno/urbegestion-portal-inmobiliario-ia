/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      colors: {
        // Los colores salen de los datos de cada corredora; la plantilla los recibe como variables.
        urbe: {
          primary: 'var(--color-urbe-primary, #164e63)',
          primaryDark: 'var(--color-urbe-primary-dark, #0f3a4b)',
          accent: 'var(--color-urbe-accent, #c59b27)',
          accentHover: 'var(--color-urbe-accent-hover, #b0881e)',
        },
      },
      fontFamily: {
        sans: ['Lato', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
