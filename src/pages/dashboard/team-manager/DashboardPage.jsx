import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'

const MATCHES = [
  { opponent: 'Red Titans',  result: 'Win',  kda: '4.2', tournament: 'ML Weekly #24', date: 'Today'      },
  { opponent: 'Blue Storm',  result: 'Loss', kda: '2.1', tournament: 'ML Weekly #24', date: 'Yesterday'  },
  { opponent: 'Nova Squad',  result: 'Win',  kda: '5.8', tournament: 'MDL S8',        date: '3 days ago' },
  { opponent: 'Iron Wolves', result: 'Win',  kda: '3.9', tournament: 'MDL S8',        date: '5 days ago' },
]

export default function TmDashboardPage() {
  return (
    <DashboardLayout title="Phantom Five" subtitle="Team Manager Dashboard">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Dashboard</h2>
      <p className="text-xs text-slate-400 mb-4">Summary for Phantom Five.</p>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Win rate"       value="68%"  sub="+4% this month" variant="up" />
        <KpiCard label="Total matches"  value="47"   sub="Season record"  variant="neutral" />
        <KpiCard label="Active players" value="5"    sub="+2 staff"       variant="neutral" />
        <KpiCard label="Tournaments"    value="3"    sub="1 ongoing"      variant="neutral" />
      </div>
      <div className="card">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent matches</p>
        <table className="w-full">
          <thead>
            <tr>{['Opponent', 'Result', 'KDA avg', 'Tournament', 'Date'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {MATCHES.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="table-td font-medium">{m.opponent}</td>
                <td className="table-td"><span className={`badge ${m.result === 'Win' ? 'badge-green' : 'badge-red'}`}>{m.result}</span></td>
                <td className="table-td font-mono">{m.kda}</td>
                <td className="table-td text-slate-500">{m.tournament}</td>
                <td className="table-td text-slate-400">{m.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
