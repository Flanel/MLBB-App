import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const STATUS_BADGE = { Ongoing:'badge-ocean', Completed:'badge-green', Cancelled:'badge-slate' }

export default function PlayerTournamentsPage() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: p } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!p?.team_id) { setLoading(false); return }
      const { data } = await supabase.from('tournaments').select('*').eq('team_id', p.team_id).order('created_at', { ascending: false })
      setTournaments(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <DashboardLayout title="Tournaments">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>History Tournament</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua tournament yang diikuti timmu.</p>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
        ) : tournaments.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Belum ada tournament.</p>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead><tr>{['Tournament','Platform','Format','Periode','Tim','Placement','Status'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{t.name}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{t.platform||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{t.format||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontSize:12 }}>{t.date_label||'—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{t.total_teams||'—'}</td>
                    <td className="table-td">{t.placement ? <span className="badge badge-green">{t.placement}</span> : <span style={{ color:'var(--text-dim)' }}>—</span>}</td>
                    <td className="table-td"><span className={`badge ${STATUS_BADGE[t.status]||'badge-slate'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
