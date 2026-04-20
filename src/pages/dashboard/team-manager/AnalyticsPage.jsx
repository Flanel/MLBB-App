import DashboardLayout from '@/components/layout/DashboardLayout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const WR_DATA = [
  { match: 'M1', wr: 50 }, { match: 'M2', wr: 60 }, { match: 'M3', wr: 55 },
  { match: 'M4', wr: 65 }, { match: 'M5', wr: 62 }, { match: 'M6', wr: 68 },
  { match: 'M7', wr: 70 }, { match: 'M8', wr: 66 }, { match: 'M9', wr: 72 },
  { match: 'M10', wr: 68 },
]

const PERFORMERS = [
  { name: 'Fajar M.', lane: 'Mid',       kda: 5.2 },
  { name: 'Reza P.',  lane: 'Gold Lane', kda: 4.8 },
  { name: 'Aldo F.',  lane: 'Jungle',    kda: 4.1 },
  { name: 'Dito S.',  lane: 'Exp Lane',  kda: 3.9 },
  { name: 'Bima R.',  lane: 'Roam',      kda: 2.8 },
]

const PLACEMENTS = [
  { name: 'MPL ID S15',    value: '4th / 8',        badge: 'badge-amber' },
  { name: 'MDL S8',        value: 'Top 8 (ongoing)', badge: 'badge-green' },
  { name: 'ML Weekly #24', value: '2nd / 12',        badge: 'badge-green' },
]

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Phantom Five" subtitle="Analytics">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Analytics</h2>
      <p className="text-xs text-slate-400 mb-4">Team performance and player comparison.</p>

      <div className="card mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Win rate trend — last 10 matches</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={WR_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="match" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis domain={[40, 80]} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={v => [`${v}%`, 'Win rate']}
            />
            <Line type="monotone" dataKey="wr" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Top performers — KDA</p>
          <div className="space-y-3">
            {PERFORMERS.map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-700">{p.name}</span>
                  <span className="text-xs text-slate-400 ml-1.5">{p.lane}</span>
                </div>
                <span className="text-sm font-mono font-medium text-brand-600">{p.kda}</span>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(p.kda / 6) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Tournament placements</p>
          <div className="space-y-3">
            {PLACEMENTS.map(t => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{t.name}</span>
                <span className={`badge ${t.badge}`}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
