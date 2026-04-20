import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'

const ACTIVITY = [
  ['Hendra K. added match result',   '10:18'],
  ['Reza P. updated activity log',    '09:55'],
  ['Hendra K. imported tournament',   'Yesterday'],
  ['Rafi A. reset user password',     'Yesterday'],
]

export default function OverviewPage() {
  return (
    <DashboardLayout title="System Overview">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Overview</h2>
      <p className="text-xs text-slate-400 mb-4">System health and usage at a glance.</p>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Teams registered"   value="1"  sub="Trial — 1 active"      variant="neutral" />
        <KpiCard label="Active users"       value="7"  sub="+2 this week"           variant="up" />
        <KpiCard label="Matches this month" value="24" sub="+8 vs last month"       variant="up" />
        <KpiCard label="Scraping jobs"      value="11" sub="10 success / 1 failed"  variant="neutral" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Teams</p>
          <table className="w-full">
            <thead>
              <tr>{['Team', 'Status', 'Members', 'Last active', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50">
                <td className="table-td font-medium">Phantom Five</td>
                <td className="table-td"><span className="badge badge-green">Active</span></td>
                <td className="table-td">7</td>
                <td className="table-td text-slate-400">Just now</td>
                <td className="table-td"><button className="btn btn-danger text-xs py-1">Deactivate</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent activity</p>
          <div className="space-y-3">
            {ACTIVITY.map(([msg, time]) => (
              <div key={msg} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-600">{msg}</p>
                  <p className="text-slate-400">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
