import { X } from 'lucide-react'
import clsx from 'clsx'

const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  danger:  'bg-red-50 border-red-200 text-red-700',
  info:    'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
}

function ToastItem({ toast, onRemove }) {
  return (
    <div className={clsx('flex items-start gap-2 px-4 py-3 rounded-lg border text-sm shadow-sm min-w-[260px] max-w-sm', styles[toast.type] || styles.info)}>
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100 mt-0.5 flex-shrink-0">
        <X size={13} />
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
