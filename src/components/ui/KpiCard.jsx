export default function KpiCard({ label, value, sub, variant = 'neutral', icon: Icon }) {
  const subColor = variant === 'up' ? 'var(--green)' : variant === 'down' ? 'var(--red)' : 'var(--text-dim)'
  return (
    <div className="card animate-fade-up" style={{ position:'relative', overflow:'hidden' }}>
      {Icon && (
        <div style={{ position:'absolute', top:12, right:12, opacity:0.08 }}>
          <Icon size={30} style={{ color:'var(--text-primary)' }} />
        </div>
      )}
      <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif', marginBottom:8 }}>{label}</p>
      <p style={{ fontSize:24, fontWeight:700, lineHeight:1, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)' }}>{value}</p>
      {sub && <p style={{ fontSize:11, marginTop:6, color: subColor }}>{sub}</p>}
    </div>
  )
}
