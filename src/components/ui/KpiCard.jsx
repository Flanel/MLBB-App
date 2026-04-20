import clsx from 'clsx'

export default function KpiCard({ label, value, sub, variant = 'neutral' }) {
  const subColor = { up: 'text-emerald-600', down: 'text-red-500', neutral: 'text-slate-400' }[variant]
  return (
    <div className="card animate-fade-up">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold font-mono text-slate-800 leading-tight">{value}</p>
      {sub && <p className={clsx('text-xs mt-1', subColor)}>{sub}</p>}
    </div>
  )
}
