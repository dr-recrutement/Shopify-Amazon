/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        accent: {
          green: '#008060',
          'green-dark': '#004c3f',
        },
        ink: {
          900: '#111114',
          800: '#1f2937',
          700: '#374151',
          500: '#6b7280',
          300: '#d1d5db',
          100: '#f3f4f6',
          50: '#f7f7f8',
        },
      },
      fontFamily: {
        sans: ['"Poppins"', 'sans-serif'],
        serif: ['"Poppins"', 'sans-serif'],
      },
      fontWeight: {
        // Global weight reduction ("réduit la graisse sur les polices") —
        // remapped centrally here rather than editing every font-bold/
        // font-extrabold/font-black usage across the codebase. Values stay
        // on weights already loaded via the Google Fonts @import in
        // index.css (400/500/600/700), so nothing falls back to a
        // synthesized/wrong weight.
        bold: '600',      // was 700
        extrabold: '600', // was 800
        black: '700',     // was 900
      },
    },
  },
  plugins: [],
};
