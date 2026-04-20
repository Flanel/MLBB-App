/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent: red — matches the NXK logo gem
        brand: {
          50:  '#1c0a0f',
          100: '#2d0f18',
          400: '#fb4c6c',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          900: '#500f23',
        },

        // Dark surface scale — used for backgrounds and containers
        surface: {
          0: '#080910',   // deepest bg (body)
          1: '#0c0d18',   // sidebar
          2: '#101220',   // card
          3: '#161828',   // hover / elevated card
          4: '#1c1f32',   // input bg
        },

        // Remapped slate to dark-friendly values
        // Higher number = lighter (readable on dark backgrounds)
        slate: {
          50:  '#0f1018',
          100: '#161824',
          200: '#1e2135',
          300: '#2a2e45',
          400: '#555a78',
          500: '#7c80a0',
          600: '#a0a4be',
          700: '#c2c5d8',
          800: '#dde0ef',
          900: '#f0f2fa',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}