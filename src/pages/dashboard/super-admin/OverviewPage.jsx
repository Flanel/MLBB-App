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
      const [{ data: teamsData }, { data: usersData }, { data: matchesData }, { data: logsData }] = await Promise.all([
        supabase.from('teams').select('id, name, is_active, created_at').order('created_at', { ascending: false }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        // DEBUG: filter to current month only so label "Bulan ini" is accurate
        supabase.from('matches').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('audit_logs').select('*, users(name, role)').order('created_at', { ascending: false }).limit(6),
      ])
      setTeams(teamsData || [])
      setRecentLogs(logsData || [])
      setStats({
        teams: teamsData?.length || 0,
        activeTeams: teamsData?.filter(t => t.is_active).length || 0,
        users: usersData?.length || 0,
        matches: matchesData?.length || 0,
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
        <KpiCard label="Total Teams" value={loading ? '—' : stats.teams} sub={`${stats.activeTeams} aktif`} variant="neutral" icon={Shield} />
        <KpiCard label="Total Users" value={loading ? '—' : stats.users} sub="Semua role" variant="neutral" icon={Users} />
        <KpiCard label="Matches" value={loading ? '—' : stats.matches} sub="Bulan ini" variant="up" icon={Swords} />
        <KpiCard label="Sistem" value="Online" sub="Semua normal" variant="up" icon={Activity} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        {/* Teams table */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Tim Terdaftar</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%' }}>
              <thead>
                <tr>{['Tim','Status','Dibuat','Aksi'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="table-td" style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0' }}>Memuat...</td></tr>
                ) : teams.length === 0 ? (
                  <tr><td colSpan={4} className="table-td" style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0' }}>Belum ada tim.</td></tr>
                ) : teams.map(t => (
                  <tr key={t.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{t.name}</td>
                    <td className="table-td"><span className={`badge ${t.is_active ? 'badge-green' : 'badge-slate'}`}>{t.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{format(new Date(t.created_at), 'd MMM yyyy')}</td>
                    <td className="table-td"><a href="/super-admin/teams" style={{ fontSize:12, color:'var(--red)', textDecoration:'none' }}>Kelola →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Aktivitas Terbaru</p>
          {recentLogs.length === 0 ? (
            <p style={{ fontSize:12, color:'var(--text-dim)', textAlign:'center', padding:'16px 0' }}>Belum ada aktivitas.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {recentLogs.map(log => (
                <div key={log.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--brand)', marginTop:5, flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:12, color:'var(--text-secondary)' }}>
                      <span style={{ color: ROLE_COLOR[log.users?.role] || 'var(--red)', fontWeight:500 }}>{log.users?.name || 'System'}</span>
                      {' · '}{log.action}
                    </p>
                    {log.target && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{log.target}</p>}
                    <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>{format(new Date(log.created_at), 'd MMM, HH:mm')}</p>
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