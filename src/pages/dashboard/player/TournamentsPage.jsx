import DashboardLayout from '@/components/layout/DashboardLayout'

const TOURNAMENTS = [
  { name: 'MDL Season 8',      platform: 'Official',  pb: 'badge-blue',  date: 'Apr 2025',     format: 'Double Elim', placement: 'Top 8',     plb: 'badge-green', matches: 6  },
  { name: 'ML Weekly Cup #24', platform: 'Challonge', pb: 'badge-slate', date: '17 Apr 2025',  format: 'Single Elim', placement: '2nd place', plb: 'badge-green', matches: 4  },
  { name: 'MPL ID Season 15',  platform: 'Official',  pb: 'badge-blue',  date: 'Jan–Mar 2025', format: 'Round Robin', placement: '4th / 8',   plb: 'badge-amber', matches: 14 },
]

export default function PlayerTournamentsPage() {
  return (
    <DashboardLayout title="Tournaments">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Tournament history</h2>
      <p className="text-xs text-slate-400 mb-4">Tournaments your team has participated in.</p>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr>{['Tournament', 'Platform', 'Date', 'Format', 'Placement', 'My matches'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {TOURNAMENTS.map((t, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="table-td font-medium">{t.name}</td>
                <td className="table-td"><span className={`badge ${t.pb}`}>{t.platform}</span></td>
                <td className="table-td text-slate-400">{t.date}</td>
                <td className="table-td text-slate-500">{t.format}</td>
                <td className="table-td"><span className={`badge ${t.plb}`}>{t.placement}</span></td>
                <td className="table-td font-mono">{t.matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
