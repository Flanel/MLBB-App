export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#001a22', 100: '#00293a', 400: '#33ddff',
          500: '#00d4ff', 600: '#00aacf', 700: '#008fb0', 900: '#004466',
        },
        surface: {
          0: '#04060d', 1: '#060810', 2: '#090d18',
          3: '#0d1220', 4: '#121828',
        },
        slate: {
          50: '#060910', 100: '#0d1220', 200: '#111a2e', 300: '#162338',
          400: '#4d6a85', 500: '#6a8faa', 600: '#8aafc8', 700: '#b0ccde',
          800: '#d8eaf7', 900: '#edf5fb',
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