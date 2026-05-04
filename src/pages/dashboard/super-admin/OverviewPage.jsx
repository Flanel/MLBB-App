import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'
import { supabase } from '@/lib/supabase'
import { Shield, Users, Swords, Activity } from 'lucide-react'
import { format } from 'date-fns'

export default function OverviewPage() {
  const [stats, setStats] = useState({ teams: 0, activeTeams: 0, users: 0, matches: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { data: teamsData },
        // FIX BUG #3: destructure `count` bukan `data` untuk head:true queries
        { count: usersCount },
        { count: matchesCount },
        { data: logsData },
      ] = await Promise.all([
        supabase.from('teams').select('id, name, is_active, created_at').order('created_at', { ascending: false }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        // DEBUG: filter to current month only so label "Bulan ini" is accurate
        supabase.from('matches').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('audit_logs').select('*, users(name, role)').order('created_at', { ascending: false }).limit(6),
      ])

      setTeams(teamsData || [])
      setRecentLogs(logsData || [])
      setStats({
        teams:       teamsData?.length || 0,
        activeTeams: teamsData?.filter(t => t.is_active).length || 0,
        users:       usersCount  || 0,   // ✓ angka benar
        matches:     matchesCount || 0,  // ✓ angka benar
      })
      setLoading(false)
    }
    load()
  }, [])

  const ROLE_COLOR = { super_admin: 'var(--red)', team_manager: 'var(--red)', staff: 'var(--amber)', player: 'var(--text-secondary)' }

  return (
    <DashboardLayout title="System Overview">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Overview</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>System health dan usage sekilas pandang.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="Total Teams" value={loading ? '—' : stats.teams}       sub={`${stats.activeTeams} aktif`} variant="neutral" icon={Shield} />
        <KpiCard label="Total Users" value={loading ? '—' : stats.users}       sub="Semua role"   variant="neutral" icon={Users} />
        <KpiCard label="Matches"     value={loading ? '—' : stats.matches}     sub="Bulan ini"    variant="up"      icon={Swords} />
        <KpiCard label="Sistem"      value="Online"                             sub="Semua normal" variant="up"      icon={Activity} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap:16 }}>
        {/* Teams table */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Tim Terdaftar</p>
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead>
                <tr>{['Tim','Status','Dibuat','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</td></tr>
                ) : teams.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Belum ada tim.</td></tr>
                ) : teams.map(t => (
                  <tr key={t.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{t.name}</td>
                    <td className="table-td">
                      <span className={`badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>
                        {t.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>
                      {format(new Date(t.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="table-td">
                      <a href={`/super-admin/teams/${t.id}/data`} style={{ fontSize:11, color:'var(--brand)' }}>Lihat Data</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent audit logs */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Aktivitas Terbaru</p>
          {loading ? (
            <p style={{ fontSize:12, color:'var(--text-dim)', textAlign:'center', padding:'24px 0' }}>Memuat...</p>
          ) : recentLogs.length === 0 ? (
            <p style={{ fontSize:12, color:'var(--text-dim)', textAlign:'center', padding:'24px 0' }}>Belum ada aktivitas.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentLogs.map(log => (
                <div key={log.id} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: ROLE_COLOR[log.users?.role] || 'var(--text-dim)', marginTop:5, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.action}</p>
                    <p style={{ fontSize:10, color:'var(--text-dim)' }}>{log.users?.name || '—'} · {format(new Date(log.created_at), 'dd MMM HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}