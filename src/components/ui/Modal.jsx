import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`modal-panel w-full ${sizes[size]}`}
        style={{
          background: '#13141f',
          border: '1px solid #252840',
          borderRadius: 12,
          padding: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2
            className="text-sm font-semibold"
            style={{ color: '#dde0ef', fontFamily: 'Syne, sans-serif' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{ width: 24, height: 24, color: '#555a78', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1e2135'; e.currentTarget.style.color = '#a0a4be' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555a78' }}
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="text-sm leading-relaxed" style={{ color: '#a0a4be' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex justify-end gap-2 mt-5 pt-4"
            style={{ borderTop: '1px solid #1e2135' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}