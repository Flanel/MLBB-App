import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Swords, Star, Target } from 'lucide-react'

export default function PlayerDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState({ kda: 0, wr: 0, total: 0, mvp: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: p } = await supabase.from('users').select('name, ign, lane, team_id, teams(name)').eq('id', user.id).single()
      setProfile(p)

      if (!p?.team_id) { setLoading(false); return }

      // Get player's match stats
      const { data: statsData } = await supabase.from('match_player_stats')
        .select('kills, deaths, assists, mvp, matches(result, opponent, tournament, date)')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const sd = statsData || []
      const totalKills   = sd.reduce((s, x) => s + (x.kills || 0), 0)
      const totalDeaths  = sd.reduce((s, x) => s + (x.deaths || 0), 0)
      const totalAssists = sd.reduce((s, x) => s + (x.assists || 0), 0)
      const kda = totalDeaths === 0 ? totalKills + totalAssists : ((totalKills + totalAssists) / totalDeaths)
      const wins = sd.filter(s => s.matches?.result === 'Win').length
      const mvpCount = sd.filter(s => s.mvp).length

      setMatches(sd)
      setStats({
        kda: kda.toFixed(2),
        wr: sd.length ? Math.round((wins / sd.length) * 100) : 0,
        total: sd.length,
        mvp: mvpCount,
      })
      setLoading(false)
    }
    load()
  }, [user])

  const initials = profile?.name ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  return (
    <DashboardLayout title={profile?.teams?.name || 'Tim'} subtitle="Player Dashboard">
      {/* Profile card */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'rgba(225,29,72,0.10)', border:'1px solid rgba(225,29,72,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'var(--red)', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{profile?.name || user?.email}</p>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{profile?.lane || '—'} · {profile?.teams?.name || '—'}</p>
        </div>
        {profile?.ign && (
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>IGN</p>
            <p style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, fontSize:13, color:'var(--red)', marginTop:2 }}>{profile.ign}</p>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="KDA Rata-rata"   value={loading ? '—' : stats.kda}    sub="Season ini"   variant="up"     icon={Target}    />
        <KpiCard label="Win Rate"        value={loading ? '—' : `${stats.wr}%`} sub="Personal"  variant="up"     icon={TrendingUp} />
        <KpiCard label="Match Dimainkan" value={loading ? '—' : stats.total}  sub="Total data"  variant="neutral" icon={Swords}    />
        <KpiCard label="MVP Count"       value={loading ? '—' : stats.mvp}   sub="Total MVP"   variant="up"     icon={Star}      />
      </div>

      <div className="card">
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Match Terbaru</p>
        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</p>
        ) : matches.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Belum ada data match.</p>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead><tr>{['Tournament','Lawan','K/D/A','Result','MVP','Tanggal'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {matches.map((s, i) => (
                  <tr key={i}>
                    <td className="table-td" style={{ color:'var(--text-muted)', fontSize:12 }}>{s.matches?.tournament||'—'}</td>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{s.matches?.opponent||'—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>{s.kills}/{s.deaths}/{s.assists}</td>
                    <td className="table-td"><span className={`badge ${s.matches?.result==='Win'?'badge-green':'badge-red'}`}>{s.matches?.result||'—'}</span></td>
                    <td className="table-td">{s.mvp ? <span className="badge badge-amber">MVP</span> : <span style={{ color:'var(--text-dim)' }}>—</span>}</td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>{s.matches?.date||'—'}</td>
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
