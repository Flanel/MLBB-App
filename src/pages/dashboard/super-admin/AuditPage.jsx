import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

const ROLE_BADGE  = { super_admin:'badge-red', team_manager:'badge-blue', staff:'badge-amber', player:'badge-slate' }
const ROLE_LABELS = { super_admin:'Super Admin', team_manager:'Team Manager', staff:'Staff', player:'Player' }

export default function AuditPage() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('audit_logs')
      .select('*, users(name, role)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  if (loading) return <DashboardLayout title="Audit Log"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

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
        {logs.length === 0
          ? <p className="text-xs text-slate-400 py-6 text-center">No activity logged yet.</p>
          : (
            <table className="w-full">
              <thead><tr>{['User','Role','Action','Target','Time'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="table-td font-medium">{log.users?.name || '—'}</td>
                    <td className="table-td">
                      {log.users?.role
                        ? <span className={`badge ${ROLE_BADGE[log.users.role]}`}>{ROLE_LABELS[log.users.role]}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    <td className="table-td">{log.action}</td>
                    <td className="table-td text-slate-400 max-w-[180px] truncate">{log.target || '—'}</td>
                    <td className="table-td font-mono text-xs text-slate-400">
                      {format(new Date(log.created_at), 'd MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </DashboardLayout>
  )
}
