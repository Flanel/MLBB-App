import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Users, Trophy, Star, Shield, Target, Zap } from 'lucide-react'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-2)', borderRadius:8, padding:'8px 12px' }}>
      <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize:12, color:p.color }}>{p.name}: {p.value}{p.unit||''}</p>
      ))}
    </div>
  )
}

function Skeleton({ w = '100%', h = 16 }) {
  return <div className="skeleton" style={{ width:w, height:h }} />
}

function KpiCard({ label, value, sub, color = 'var(--brand)', icon: Icon }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif' }}>{label}</p>
        {Icon && <Icon size={14} style={{ color:'var(--text-dim)', opacity:0.5 }} />}
      </div>
      <p style={{ fontSize:26, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:-4 }}>{sub}</p>}
    </div>
  )
}

export default function CaptainAnalyticsPage() {
  const { user } = useAuth()

  const [loading, setLoading]         = useState(true)
  const [teamName, setTeamName]       = useState('')
  const [wrData, setWrData]           = useState([])
  const [performers, setPerformers]   = useState([])
  const [placements, setPlacements]   = useState([])
  const [kpi, setKpi]                 = useState({ total:0, wins:0, losses:0, wr:0 })
  const [roleWr, setRoleWr]           = useState([])   // win rate per lane/role
  const [heroStats, setHeroStats]     = useState([])   // top heroes by usage
  const [hasMatches, setHasMatches]   = useState(false)
  const [hasPlayers, setHasPlayers]   = useState(false)
  const [hasTournaments, setHasTournaments] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase
        .from('users').select('team_id, teams(name)').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      const tid = profile.team_id
      setTeamName(profile.teams?.name || 'Tim Saya')

      const [
        { data: matchData },
        { data: tournData },
        { data: allMatchIds },
      ] = await Promise.all([
        supabase.from('matches')
          .select('id, result, date')
          .eq('team_id', tid)
          .order('date')
          .limit(50),
        supabase.from('tournaments')
          .select('name, placement, status, platform')
          .eq('team_id', tid)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('matches')
          .select('id')
          .eq('team_id', tid),
      ])

      const mx = matchData || []
      setHasMatches(mx.length > 0)

      if (mx.length > 0) {
        // KPI summary
        const wins   = mx.filter(m => m.result === 'Win').length
        const total  = mx.length
        setKpi({ total, wins, losses: total - wins, wr: Math.round((wins / total) * 100) })

        // Win rate trend — 10 match terakhir
        const wrSeries = mx.map((m, i) => {
          const slice = mx.slice(0, i + 1)
          const w = slice.filter(x => x.result === 'Win').length
          return { match: `M${i + 1}`, wr: Math.round((w / slice.length) * 100) }
        })
        setWrData(wrSeries.slice(-10))
      }

      // Player stats
      const ids = (allMatchIds || []).map(m => m.id)
      if (ids.length > 0) {
        const { data: playerStats } = await supabase
          .from('match_player_stats')
          .select('player_id, kills, deaths, assists, hero, mvp, users(name, lane)')
          .in('match_id', ids)

        const byPlayer = {}
        const byLane   = {}
        const byHero   = {}

        ;(playerStats || []).forEach(s => {
          // Per player KDA
          const name = s.users?.name || 'Unknown'
          const lane = s.users?.lane || '?'
          if (!byPlayer[name]) byPlayer[name] = { name, lane, kills:0, deaths:0, assists:0, mvp:0, count:0 }
          byPlayer[name].kills   += s.kills
          byPlayer[name].deaths  += s.deaths
          byPlayer[name].assists += s.assists
          byPlayer[name].mvp     += s.mvp ? 1 : 0
          byPlayer[name].count++

          // Per lane
          if (lane !== '?') {
            if (!byLane[lane]) byLane[lane] = { lane, kills:0, deaths:0, assists:0, count:0 }
            byLane[lane].kills   += s.kills
            byLane[lane].deaths  += s.deaths
            byLane[lane].assists += s.assists
            byLane[lane].count++
          }

          // Hero usage
          if (s.hero) {
            if (!byHero[s.hero]) byHero[s.hero] = { hero:s.hero, count:0, wins:0 }
            byHero[s.hero].count++
          }
        })

        const perf = Object.values(byPlayer).map(p => ({
          name: p.name, lane: p.lane,
          kda: p.deaths === 0
            ? (p.kills + p.assists).toFixed(1)
            : ((p.kills + p.assists) / p.deaths).toFixed(2),
          avgKills:   (p.kills   / p.count).toFixed(1),
          avgDeaths:  (p.deaths  / p.count).toFixed(1),
          avgAssists: (p.assists / p.count).toFixed(1),
          mvpCount:   p.mvp,
          matches:    p.count,
        })).sort((a, b) => b.kda - a.kda).slice(0, 5)

        if (perf.length > 0) {
          setHasPlayers(true)
          setPerformers(perf)
        }

        // Lane contribution
        const laneArr = Object.values(byLane).map(l => ({
          lane: l.lane,
          kda: l.deaths === 0
            ? parseFloat((l.kills + l.assists).toFixed(1))
            : parseFloat(((l.kills + l.assists) / l.deaths).toFixed(2)),
        })).sort((a, b) => b.kda - a.kda)
        setRoleWr(laneArr)

        // Top heroes
        const heroArr = Object.values(byHero)
          .sort((a, b) => b.count - a.count).slice(0, 6)
        setHeroStats(heroArr)
      }

      if (tournData?.length > 0) {
        setHasTournaments(true)
        setPlacements(tournData)
      }

      setLoading(false)
    }
    load()
  }, [user])

  const wrColor = kpi.wr >= 60 ? 'var(--green)' : kpi.wr >= 45 ? 'var(--brand)' : 'var(--red)'
  const LANE_COLORS = ['#e11d48','#7c3aed','#0d9488','#2563eb','#d97706','#475569']

  return (
    <DashboardLayout title="Analytics Tim">
      {/* Header */}
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:0 }}>
              Analytics Tim
            </h2>
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:5, background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.25)', color:'#fbbf24', fontWeight:600 }}>
              ★ KAPTEN
            </span>
          </div>
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>
            {teamName} — data performa tim &amp; analisis mendalam pemain.
          </p>
        </div>
        <div style={{ fontSize:11, color:'var(--text-dim)', padding:'4px 10px', borderRadius:6, background:'var(--bg-elevated)', border:'1px solid var(--border-1)' }}>
          Read-only
        </div>
      </div>

      {/* KPI Row */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(120px,100%),1fr))', gap:12, marginBottom:16 }}>
          {[1,2,3,4].map(i => <div key={i} className="card"><Skeleton h={60}/></div>)}
        </div>
      ) : hasMatches && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:16 }}>
          <KpiCard label="Total Match"  value={kpi.total}          sub="match dimainkan"       color="var(--text-primary)" icon={Shield}  />
          <KpiCard label="Win Rate"     value={`${kpi.wr}%`}       sub={`${kpi.wins}W / ${kpi.losses}L`} color={wrColor}    icon={Target}  />
          <KpiCard label="Total Wins"   value={kpi.wins}            sub="kemenangan"             color="var(--green)"        icon={Star}    />
          <KpiCard label="Tournaments"  value={placements.length}   sub="dicatat"                color="var(--brand)"        icon={Trophy}  />
        </div>
      )}

      {/* Win Rate Trend */}
      <div className="card" style={{ marginBottom:16 }}>
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
          Tren Win Rate — 10 Match Terakhir
        </p>
        {loading ? <Skeleton h={180}/> : !hasMatches ? (
          <div className="empty-state">
            <div className="empty-state-icon"><TrendingUp size={18} style={{ color:'var(--text-dim)' }}/></div>
            <p style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>Belum ada data match</p>
            <p style={{ fontSize:12, color:'var(--text-dim)' }}>Data akan muncul setelah match diinput oleh manager.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wrData} margin={{ top:4, right:8, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
              <XAxis dataKey="match" tick={{ fontSize:11, fill:'var(--text-dim)' }} />
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-dim)' }} unit="%" />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="wr" stroke="var(--brand)" strokeWidth={2}
                dot={{ r:3, fill:'var(--brand)' }} activeDot={{ r:5 }} unit="%" name="Win Rate" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:16, marginBottom:16 }}>
        {/* Top Performer KDA */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
            Top Performer — KDA
          </p>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={40}/>)}
            </div>
          ) : !hasPlayers ? (
            <div className="empty-state" style={{ padding:'24px 0' }}>
              <div className="empty-state-icon"><Users size={16} style={{ color:'var(--text-dim)' }}/></div>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada statistik pemain</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {performers.map((p, i) => (
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:18, fontSize:10, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', flexShrink:0 }}>#{i+1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{p.name}</p>
                    <p style={{ fontSize:10, color:'var(--text-dim)' }}>{p.lane} · {p.matches} match · {p.mvpCount} MVP</p>
                    <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>
                      K {p.avgKills} / D {p.avgDeaths} / A {p.avgAssists}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:15, fontWeight:700, color:'var(--red)' }}>{p.kda}</span>
                    <p style={{ fontSize:9, color:'var(--text-dim)' }}>KDA</p>
                  </div>
                  <div style={{ width:52, height:4, background:'var(--border-1)', borderRadius:2, overflow:'hidden', flexShrink:0 }}>
                    <div style={{ height:'100%', background:'var(--brand)', borderRadius:2, width:`${Math.min((parseFloat(p.kda)/8)*100,100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Placement */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
            Placement Tournament
          </p>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={36}/>)}
            </div>
          ) : !hasTournaments ? (
            <div className="empty-state" style={{ padding:'24px 0' }}>
              <div className="empty-state-icon"><Trophy size={16} style={{ color:'var(--text-dim)' }}/></div>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada data tournament</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {placements.map((t, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom: i < placements.length-1 ? '1px solid var(--border-1)' : 'none' }}>
                  <div>
                    <p style={{ fontSize:13, color:'var(--text-secondary)' }}>{t.name}</p>
                    {t.platform && <p style={{ fontSize:10, color:'var(--text-dim)' }}>{t.platform}</p>}
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {t.placement && <span className="badge badge-green">{t.placement}</span>}
                    <span className={`badge ${t.status==='Ongoing'?'badge-ocean':'badge-slate'}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lane KDA Contribution */}
      {!loading && roleWr.length > 0 && (
        <div className="card" style={{ marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
            KDA Kontribusi per Lane
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roleWr} margin={{ top:4, right:8, bottom:0, left:-20 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
              <XAxis dataKey="lane" tick={{ fontSize:11, fill:'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-dim)' }} />
              <Tooltip
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-2)', borderRadius:8, padding:'8px 12px' }}>
                    <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>KDA: {payload[0].value}</p>
                  </div>
                ) : null}
              />
              <Bar dataKey="kda" radius={[6,6,0,0]} name="KDA">
                {roleWr.map((_, i) => <Cell key={i} fill={LANE_COLORS[i % LANE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hero Usage */}
      {!loading && heroStats.length > 0 && (
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
            Hero Paling Sering Dimainkan
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
            {heroStats.map((h, i) => (
              <div key={h.hero} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border-1)', display:'flex', flexDirection:'column', gap:4 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.hero}</p>
                <p style={{ fontSize:10, color:'var(--text-dim)' }}>{h.count}× dimainkan</p>
                <div style={{ height:3, background:'var(--border-1)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background: LANE_COLORS[i % LANE_COLORS.length], borderRadius:2, width:`${Math.min((h.count/heroStats[0].count)*100,100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}