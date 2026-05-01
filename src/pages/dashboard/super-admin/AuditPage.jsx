import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Download, RefreshCw } from 'lucide-react'

const ROLE_BADGE  = { super_admin:'badge-red', team_manager:'badge-ocean', staff:'badge-amber', player:'badge-slate' }
const ROLE_LABELS = { super_admin:'Super Admin', team_manager:'Manager', staff:'Staff', player:'Player' }

export default function AuditPage() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRole] = useState('all')

  function fetchLogs() {
    setLoading(true)
    supabase.from('audit_logs').select('*, users(name, role)').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }

  useEffect(() => { fetchLogs() }, [])

  function exportCSV() {
    const rows = [['User','Role','Action','Target','Time']]
    filtered.forEach(l => rows.push([l.users?.name||'', ROLE_LABELS[l.users?.role]||'', l.action, l.target||'', format(new Date(l.created_at),'d MMM yyyy HH:mm')]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'audit_log.csv'; a.click()
  }

  const filtered = logs.filter(l => {
    const matchSearch = !search || (l.action+l.target+l.users?.name).toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || l.users?.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <DashboardLayout title="Audit Log">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Audit Log</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua aktivitas sistem di semua role dan tim.</p>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <input className="form-input" style={{ maxWidth:220 }} placeholder="Cari aksi, user..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="form-input" style={{ maxWidth:150 }} value={roleFilter} onChange={e=>setRole(e.target.value)}>
            <option value="all">Semua role</option>
            <option value="super_admin">Super Admin</option>
            <option value="team_manager">Team Manager</option>
            <option value="staff">Staff</option>
            <option value="player">Player</option>
          </select>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button className="btn" style={{ padding:'6px 10px' }} onClick={fetchLogs} title="Refresh"><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
            <button className="btn btn-primary" onClick={exportCSV} style={{ gap:6 }}><Download size={13}/>Export CSV</button>
          </div>
        </div>

        <div className="table-scroll-container">
          {loading ? (
            <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Tidak ada log yang ditemukan.</p>
          ) : (
            <table style={{ width:'100%', minWidth:600 }}>
              <thead><tr>{['User','Role','Aksi','Target','Waktu'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{log.users?.name||'System'}</td>
                    <td className="table-td">
                      {log.users?.role ? <span className={`badge ${ROLE_BADGE[log.users.role]||'badge-slate'}`}>{ROLE_LABELS[log.users.role]}</span> : <span style={{color:'var(--text-dim)'}}>—</span>}
                    </td>
                    <td className="table-td">{log.action}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.target||'—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'var(--text-dim)' }}>
                      {format(new Date(log.created_at),'d MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
