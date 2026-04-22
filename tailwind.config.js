export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  '#e0f2fe', 100: '#bae6fd', 200: '#7dd3fc',
          300: '#38bdf8', 400: '#0ea5e9', 500: '#0284c7', 600: '#0369a1', 700: '#075985',
        },
        navy: { bright: '#3b82f6', light: '#60a5fa', muted: '#1e3a5f', dim: '#0f2240' },
        surface: {
          0: '#020408', 1: '#04080f', 2: '#060d18',
          3: '#091525', 4: '#0c1d35', 5: '#0f2540',
        },
        border: { 1: '#0d2040', 2: '#153059', 3: '#1e4278' },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: { DEFAULT: '8px' },
    },
  },
  plugins: [],
}
