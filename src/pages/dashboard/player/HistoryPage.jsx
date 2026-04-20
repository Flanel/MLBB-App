import DashboardLayout from '@/components/layout/DashboardLayout'

const HISTORY = [
  { date: '18 Apr', tournament: 'ML Weekly #24', opponent: 'Red Titans',  hero: 'Layla',  kda: '7/1/8',  kdaNum: 7.50,  result: 'Win'  },
  { date: '17 Apr', tournament: 'ML Weekly #24', opponent: 'Blue Storm',  hero: 'Lesley', kda: '3/4/2',  kdaNum: 1.25,  result: 'Loss' },
  { date: '15 Apr', tournament: 'MDL S8',        opponent: 'Nova Squad',  hero: 'Bruno',  kda: '9/0/6',  kdaNum: 15.00, result: 'Win'  },
  { date: '13 Apr', tournament: 'MDL S8',        opponent: 'Iron Wolves', hero: 'Claude', kda: '6/2/4',  kdaNum: 5.00,  result: 'Win'  },
  { date: '11 Apr', tournament: 'MDL S8',        opponent: 'Ghost Kings', hero: 'Miya',   kda: '4/3/3',  kdaNum: 2.33,  result: 'Win'  },
  { date: '9 Apr',  tournament: 'Scrim',         opponent: 'Team Alpha',  hero: 'Bruno',  kda: '8/1/5',  kdaNum: 6.50,  result: 'Win'  },
]

export default function HistoryPage() {
  return (
    <DashboardLayout title="Match History">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Match History</h2>
      <p className="text-xs text-slate-400 mb-4">All your recorded matches this season.</p>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['Date', 'Tournament', 'Opponent', 'Hero', 'K/D/A', 'KDA', 'Result'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {HISTORY.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="table-td text-slate-400">{m.date}</td>
                <td className="table-td text-slate-500">{m.tournament}</td>
                <td className="table-td font-medium">{m.opponent}</td>
                <td className="table-td">{m.hero}</td>
                <td className="table-td font-mono text-xs">{m.kda}</td>
                <td className="table-td font-mono font-medium text-brand-600">{m.kdaNum.toFixed(2)}</td>
                <td className="table-td"><span className={`badge ${m.result === 'Win' ? 'badge-green' : 'badge-red'}`}>{m.result}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
