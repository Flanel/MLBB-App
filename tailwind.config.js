export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#071825', 100: '#0c2233', 400: '#67e8f9',
          500: '#22d3ee', 600: '#0891b2', 700: '#0e7490', 900: '#164e63',
        },
        surface: {
          0: '#0f1623', 1: '#111827', 2: '#161f2e',
          3: '#1c2840', 4: '#1e2d45',
        },
        slate: {
          50: '#0f1623', 100: '#161f2e', 200: '#1e2d45', 300: '#243450',
          400: '#506a8a', 500: '#6b8aaa', 600: '#94a9c4', 700: '#bacad9',
          800: '#e2eaf5', 900: '#f0f5fb',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}