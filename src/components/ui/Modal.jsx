import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZES = { sm: '400px', md: '500px', lg: '620px', xl: '740px' }

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
        background: 'rgba(0,0,0,0.40)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="modal-panel"
        style={{
          width: '100%',
          maxWidth: SIZES[size] || SIZES.md,
          background: 'var(--canvas)',
          border: 'var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-deep)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90dvh',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: 'var(--border)', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', background: 'transparent',
              border: 'none', color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--canvas-alt)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{
          padding: '20px',
          fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)',
          overflowY: 'auto',
          flex: 1,
          WebkitOverflowScrolling: 'touch',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '14px 20px', borderTop: 'var(--border)',
            background: 'var(--canvas-alt)', flexShrink: 0,
            paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
