/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index-02.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        urbe: {
          dark: '#0d1b1e',      // Slate obsidian
          primary: '#164e63',   // Deep Ocean Cyan/Teal
          primaryDark: '#0f3a4b',
          accent: '#c59b27',    // Luxury Champagne Gold
          accentHover: '#b0881e',
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
