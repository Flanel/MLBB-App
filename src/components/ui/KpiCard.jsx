import clsx from 'clsx'

const subColors = {
  up:      '#34d399',
  down:    '#fb4c6c',
  neutral: '#555a78',
}

export default function KpiCard({ label, value, sub, variant = 'neutral' }) {
  return (
    <div className="card animate-fade-up" style={{ borderColor: '#1e2135' }}>
      <p
        className="text-xs font-medium uppercase tracking-wider mb-2"
        style={{ color: '#555a78', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em' }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold leading-none"
        style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#dde0ef' }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-xs mt-1.5"
          style={{ color: subColors[variant] || subColors.neutral }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}