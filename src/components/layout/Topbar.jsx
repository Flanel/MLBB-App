import { Bell } from 'lucide-react'

export default function Topbar({ title, subtitle }) {
  return (
    <header
      className="flex items-center gap-3 px-5 bg-white border-b border-slate-200 flex-shrink-0"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-800 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <button className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>
    </header>
  )
}
