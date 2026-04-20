import { Bell, ChevronRight } from 'lucide-react'

export default function Topbar({ title, subtitle }) {
  return (
    <header
      className="flex items-center gap-3 px-5 flex-shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: '#0c0d18',
        borderBottom: '1px solid #1e2135',
      }}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {subtitle ? (
          <>
            <span
              className="text-sm font-medium truncate"
              style={{ color: '#555a78', fontFamily: 'Syne, sans-serif' }}
            >
              {title}
            </span>
            <ChevronRight size={13} style={{ color: '#2a2e45', flexShrink: 0 }} />
            <span
              className="text-sm font-semibold truncate"
              style={{ color: '#dde0ef', fontFamily: 'Syne, sans-serif' }}
            >
              {subtitle}
            </span>
          </>
        ) : (
          <span
            className="text-sm font-semibold truncate"
            style={{ color: '#dde0ef', fontFamily: 'Syne, sans-serif' }}
          >
            {title}
          </span>
        )}
      </div>

      <button
        className="relative flex items-center justify-center rounded-lg transition-colors"
        style={{ width: 32, height: 32, color: '#555a78', background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#161828'; e.currentTarget.style.color = '#a0a4be' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555a78' }}
      >
        <Bell size={15} strokeWidth={1.75} />
        <span
          className="absolute top-1.5 right-1.5 rounded-full"
          style={{ width: 5, height: 5, background: '#e11d48' }}
        />
      </button>
    </header>
  )
}