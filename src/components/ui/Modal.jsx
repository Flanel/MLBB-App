import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZES = { sm:'380px', md:'480px', lg:'600px', xl:'720px' }

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px', background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-modal="true" className="modal-panel"
        style={{ width:'100%', maxWidth: SIZES[size] || SIZES.md, background:'var(--bg-surface)', border:'1px solid var(--border-2)', borderRadius:14, padding:'20px', boxShadow:'var(--shadow-deep)' }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' }}
          >
            <X size={14} strokeWidth={1.75}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ fontSize:13, lineHeight:1.6, color:'var(--text-secondary)' }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border-1)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
