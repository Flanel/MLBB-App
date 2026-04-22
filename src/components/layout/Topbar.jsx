import { Bell, ChevronRight, Menu } from 'lucide-react'

export default function Topbar({ title, subtitle, onMenuClick }) {
  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: '#0c0d18',
      borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 20px', flexShrink: 0,
    }}>
      {/* Hamburger - mobile only via CSS */}
      <button
        onClick={onMenuClick}
        className="hamburger-btn"
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer',
          padding: 4, borderRadius: 6,
          display: 'none', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Menu size={18} />
      </button>

      <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:8 }}>
        {subtitle ? (
          <>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--text-muted)', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            <ChevronRight size={12} style={{ color:'var(--border-3)', flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{subtitle}</span>
          </>
        ) : (
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'Syne,sans-serif' }}>{title}</span>
        )}
      </div>

      <button
        style={{ position:'relative', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.color='var(--text-secondary)' }}
        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' }}
      >
        <Bell size={15} strokeWidth={1.75} />
        <span style={{ position:'absolute', top:6, right:6, width:5, height:5, borderRadius:'50%', background:'var(--brand)' }} />
      </button>
    </header>
  )
}
