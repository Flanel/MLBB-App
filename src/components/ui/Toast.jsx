import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const CONFIG = {
  success: { icon: CheckCircle, color: 'var(--green)',  bg: 'var(--green-bg)' },
  danger:  { icon: XCircle,     color: 'var(--red)',    bg: 'var(--red-bg)'   },
  warning: { icon: AlertTriangle,color:'var(--amber)',  bg: 'var(--amber-bg)' },
}

function Toast({ id, message, type = 'success', onRemove }) {
  const cfg = CONFIG[type] || CONFIG.success
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000)
    return () => clearTimeout(t)
  }, [id, onRemove])

  return (
    <div className="animate-fade-up" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'var(--bg-elevated)', border:`1px solid ${cfg.color}30`, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', minWidth:260, maxWidth:360 }}>
      <Icon size={14} style={{ color: cfg.color, flexShrink:0 }} />
      <p style={{ flex:1, fontSize:12, color:'var(--text-primary)', lineHeight:1.4 }}>{message}</p>
      <button onClick={() => onRemove(id)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2, flexShrink:0 }}>
        <X size={12} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts?.length) return null
  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:100, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => <Toast key={t.id} {...t} onRemove={onRemove} />)}
    </div>
  )
}
