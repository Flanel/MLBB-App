import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'

const RECENT = [
  { tournament: 'ML Weekly #24', opponent: 'Red Titans',  hero: 'Layla',  kda: '7/1/8', result: 'Win',  mvp: true,  date: 'Today'     },
  { tournament: 'ML Weekly #24', opponent: 'Blue Storm',  hero: 'Lesley', kda: '3/4/2', result: 'Loss', mvp: false, date: 'Yesterday' },
  { tournament: 'MDL S8',        opponent: 'Nova Squad',  hero: 'Bruno',  kda: '9/0/6', result: 'Win',  mvp: true,  date: '3 days ago'},
]

export default function PlayerDashboardPage() {
  return (
    <DashboardLayout title="Phantom Five" subtitle="Player Dashboard">
      <div className="flex items-center gap-4 card mb-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-base font-semibold text-emerald-700 flex-shrink-0">
          RP
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">Reza P.</p>
          <p className="text-xs text-slate-400">Gold Lane · Phantom Five</p>
          <span className="badge badge-green mt-1">Active</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">IGN</p>
          <p className="font-mono font-medium text-sm text-slate-700">RezaGold</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="KDA average"    value="4.8"  sub="+0.3 this month" variant="up" />
        <KpiCard label="Win rate"       value="71%"  sub="Top on team"     variant="up" />
        <KpiCard label="Matches played" value="47"   sub="Season total"    variant="neutral" />
        <KpiCard label="MVP count"      value="12"   sub="25% of matches"  variant="up" />
      </div>

      <div className="card">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent matches</p>
        <table className="w-full">
          <thead>
            <tr>{['Tournament', 'Opponent', 'Hero', 'K/D/A', 'Result', 'MVP', 'Date'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {RECENT.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="table-td text-slate-500">{m.tournament}</td>
                <td className="table-td font-medium">{m.opponent}</td>
                <td className="table-td">{m.hero}</td>
                <td className="table-td font-mono text-xs">{m.kda}</td>
                <td className="table-td"><span className={`badge ${m.result === 'Win' ? 'badge-green' : 'badge-red'}`}>{m.result}</span></td>
                <td className="table-td">{m.mvp ? <span className="badge badge-amber">MVP</span> : <span className="text-slate-300">—</span>}</td>
                <td className="table-td text-slate-400">{m.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
