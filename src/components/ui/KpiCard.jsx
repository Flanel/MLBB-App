export default function KpiCard({ label, value, sub, variant = 'neutral', icon: Icon }) {
  const subColor = variant === 'up'   ? 'var(--green)'
                 : variant === 'down' ? 'var(--red)'
                 : 'var(--text-dim)'
  return (
    <div className="card animate-fade-up" style={{ position:'relative', overflow:'hidden' }}>
      {/* Subtle top accent for 'up' variant */}
      {variant === 'up' && (
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, var(--brand), transparent)', borderRadius:'14px 14px 0 0', opacity:0.6 }} />
      )}
      {Icon && (
        <div style={{ position:'absolute', top:12, right:12, opacity:0.06 }}>
          <Icon size={32} style={{ color:'var(--text-primary)' }} />
        </div>
      )}
      <p style={{ fontSize:9.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif', marginBottom:8 }}>
        {label}
      </p>
      <p style={{ fontSize:22, fontWeight:700, lineHeight:1, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)', letterSpacing:'-0.5px' }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize:10.5, marginTop:7, color:subColor, fontWeight:500 }}>{sub}</p>
      )}
    </div>
  )
}
