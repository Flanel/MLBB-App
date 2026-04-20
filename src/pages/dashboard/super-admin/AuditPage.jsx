import DashboardLayout from '@/components/layout/DashboardLayout'

const LOGS = [
  { user: 'Rafi A.',    role: 'super_admin',  action: 'Viewed team details',      target: 'Phantom Five',               date: 'Today',     time: '10:42' },
  { user: 'Hendra K.', role: 'team_manager', action: 'Added match result',        target: 'ML Weekly #24',              date: 'Today',     time: '10:18' },
  { user: 'Reza P.',   role: 'player',       action: 'Updated activity log',      target: 'Personal',                   date: 'Today',     time: '09:55' },
  { user: 'Dito S.',   role: 'player',       action: 'Updated activity log',      target: 'Personal',                   date: 'Today',     time: '09:30' },
  { user: 'Hendra K.', role: 'team_manager', action: 'Imported tournament',       target: 'MDL Season 8',               date: 'Yesterday', time: '18:02' },
  { user: 'Hendra K.', role: 'team_manager', action: 'Scraping job triggered',    target: 'challonge.com/ml-weekly-24', date: 'Yesterday', time: '17:58' },
  { user: 'Rafi A.',   role: 'super_admin',  action: 'Reset user password',       target: 'Dito S.',                    date: 'Yesterday', time: '15:30' },
  { user: 'Aldo F.',   role: 'player',       action: 'Viewed match history',      target: 'Personal',                   date: 'Yesterday', time: '14:10' },
]
const ROLE_BADGE  = { super_admin: 'badge-red', team_manager: 'badge-blue', staff: 'badge-amber', player: 'badge-slate' }
const ROLE_LABELS = { super_admin: 'Super Admin', team_manager: 'Team Manager', staff: 'Staff', player: 'Player' }

export default function AuditPage() {
  return (
    <DashboardLayout title="Audit Log">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Audit Log</h2>
      <p className="text-xs text-slate-400 mb-4">All system activity across all roles and teams.</p>
      <div className="card">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <input className="form-input max-w-[180px]" placeholder="Search..." />
          <select className="form-input max-w-[140px]">
            <option>All roles</option><option>Super Admin</option><option>Team Manager</option><option>Player</option>
          </select>
          <button className="btn btn-primary text-xs ml-auto">Export CSV</button>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['User', 'Role', 'Action', 'Target', 'Date', 'Time'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {LOGS.map((log, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="table-td font-medium">{log.user}</td>
                <td className="table-td"><span className={`badge ${ROLE_BADGE[log.role]}`}>{ROLE_LABELS[log.role]}</span></td>
                <td className="table-td">{log.action}</td>
                <td className="table-td text-slate-400 max-w-[180px] truncate">{log.target}</td>
                <td className="table-td text-slate-400">{log.date}</td>
                <td className="table-td font-mono text-xs text-slate-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
