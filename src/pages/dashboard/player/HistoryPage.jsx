import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function HistoryPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    if (!user) return
    supabase.from('match_player_stats')
      .select('kills, deaths, assists, hero, mvp, damage, matches(result, opponent, tournament, date, score)')
      .eq('player_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRecords(data || []); setLoading(false) })
  }, [user])

  const filtered = records.filter(r => filter === 'all' || r.matches?.result === filter)
  const wins = records.filter(r => r.matches?.result === 'Win').length
  const wr = records.length ? Math.round((wins / records.length) * 100) : 0
  const avgKDA = records.length
    ? (records.reduce((s, r) => {
        const kda = r.deaths === 0 ? (r.kills + r.assists) : ((r.kills + r.assists) / r.deaths)
        return s + kda
      }, 0) / records.length).toFixed(2)
    : '—'

  return (
    <DashboardLayout title="Match History">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Match History</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua match tercatat milikmu season ini.</p>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Match', value: records.length },
          { label:'Win Rate', value: `${wr}%` },
          { label:'Avg KDA', value: avgKDA },
        ].map(k => (
          <div key={k.label} className="card">
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif', marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {[['all','Semua'],['Win','Menang'],['Loss','Kalah']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={filter===v ? 'btn btn-primary' : 'btn'} style={{ fontSize:12, padding:'5px 12px' }}>
              {l}
            </button>
          ))}
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-dim)', alignSelf:'center' }}>{filtered.length} match</span>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Tidak ada data match.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%' }}>
              <thead><tr>{['Tournament','Lawan','Hero','K/D/A','KDA','Damage','Hasil','MVP'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((r, i) => {
                  const kda = r.deaths === 0 ? (r.kills + r.assists) : ((r.kills + r.assists) / r.deaths)
                  return (
                    <tr key={i}>
                      <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{r.matches?.tournament||'—'}</td>
                      <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{r.matches?.opponent||'—'}</td>
                      <td className="table-td">{r.hero||'—'}</td>
                      <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>{r.kills}/{r.deaths}/{r.assists}</td>
                      <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color:'var(--ocean-300)' }}>{kda.toFixed(2)}</td>
                      <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>{r.damage ? r.damage.toLocaleString() : '—'}</td>
                      <td className="table-td"><span className={`badge ${r.matches?.result==='Win'?'badge-green':'badge-red'}`}>{r.matches?.result||'—'}</span></td>
                      <td className="table-td">{r.mvp ? <span className="badge badge-amber">MVP</span> : <span style={{ color:'var(--text-dim)' }}>—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
