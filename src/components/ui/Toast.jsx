import { X } from 'lucide-react'

const styles = {
  success: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#34d399',
  },
  danger: {
    background: 'rgba(225, 29, 72, 0.1)',
    border: '1px solid rgba(225, 29, 72, 0.2)',
    color: '#fb4c6c',
  },
  info: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: '#60a5fa',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
  },
}

function ToastItem({ toast, onRemove }) {
  const style = styles[toast.type] || styles.info
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm animate-fade-up"
      style={{
        ...style,
        backdropFilter: 'blur(12px)',
        minWidth: 260,
        maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
      >
        <X size={13} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}