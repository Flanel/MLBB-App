import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Users, Trophy, Shield, Target, Star, Flame } from 'lucide-react'

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
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif' }}>{label}</p>
        {Icon && <Icon size={13} style={{ color:'var(--text-dim)', opacity:0.45 }} />}
      </div>
      <p style={{ fontSize:24, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--text-dim)' }}>{sub}</p>}
    </div>
  )
}

const LANE_COLORS = ['#e11d48','#7c3aed','#0d9488','#2563eb','#d97706','#64748b']

// ─── Core analytics loader ────────────────────────────────────────────────────
async function loadTeamAnalytics(tid) {
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
    supabase.from('matches').select('id').eq('team_id', tid),
  ])

  const mx = matchData || []
  if (mx.length === 0) return { hasMatches:false, kpi:{}, wrData:[], performers:[], placements:[], roleKda:[], heroStats:[], hasTournaments:false }

  // KPI
  const wins   = mx.filter(m => m.result === 'Win').length
  const total  = mx.length
  // Current win streak
  let streak = 0
  for (let i = mx.length - 1; i >= 0; i--) {
    if (mx[i].result === 'Win') streak++; else break
  }
  const kpi = { total, wins, losses: total - wins, wr: Math.round((wins / total) * 100), streak }

  // WR trend
  const wrData = mx.map((m, i) => {
    const slice = mx.slice(0, i + 1)
    const w = slice.filter(x => x.result === 'Win').length
    return { match: `M${i + 1}`, wr: Math.round((w / slice.length) * 100) }
  }).slice(-10)

  // Player & hero stats
  const ids = (allMatchIds || []).map(m => m.id)
  let performers = [], roleKda = [], heroStats = []

  if (ids.length > 0) {
    const { data: playerStats } = await supabase
      .from('match_player_stats')
      .select('player_id, kills, deaths, assists, hero, mvp, users(name, lane)')
      .in('match_id', ids)

    const byPlayer = {}, byLane = {}, byHero = {}
    ;(playerStats || []).forEach(s => {
      const name = s.users?.name || 'Unknown'
      const lane = s.users?.lane || '?'
      if (!byPlayer[name]) byPlayer[name] = { name, lane, kills:0, deaths:0, assists:0, mvp:0, count:0 }
      byPlayer[name].kills   += s.kills
      byPlayer[name].deaths  += s.deaths
      byPlayer[name].assists += s.assists
      byPlayer[name].mvp     += s.mvp ? 1 : 0
      byPlayer[name].count++

      if (lane !== '?') {
        if (!byLane[lane]) byLane[lane] = { kills:0, deaths:0, assists:0, count:0 }
        byLane[lane].kills   += s.kills
        byLane[lane].deaths  += s.deaths
        byLane[lane].assists += s.assists
        byLane[lane].count++
      }

      if (s.hero) {
        if (!byHero[s.hero]) byHero[s.hero] = { hero:s.hero, count:0 }
        byHero[s.hero].count++
      }
    })

    performers = Object.values(byPlayer).map(p => ({
      name:p.name, lane:p.lane, matches:p.count, mvpCount:p.mvp,
      avgKills:   (p.kills   / p.count).toFixed(1),
      avgDeaths:  (p.deaths  / p.count).toFixed(1),
      avgAssists: (p.assists / p.count).toFixed(1),
      kda: p.deaths === 0
        ? (p.kills + p.assists).toFixed(1)
        : ((p.kills + p.assists) / p.deaths).toFixed(2),
    })).sort((a, b) => b.kda - a.kda).slice(0, 5)

    roleKda = Object.entries(byLane).map(([lane, l]) => ({
      lane,
      kda: l.deaths === 0
        ? parseFloat((l.kills + l.assists).toFixed(1))
        : parseFloat(((l.kills + l.assists) / l.deaths).toFixed(2)),
    })).sort((a, b) => b.kda - a.kda)

    heroStats = Object.values(byHero).sort((a, b) => b.count - a.count).slice(0, 6)
  }

  const placements = tournData || []

  return {
    hasMatches: true,
    hasTournaments: placements.length > 0,
    kpi, wrData, performers,
    placements, roleKda, heroStats,
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user, role } = useAuth()
  const isSuperAdmin = role === 'super_admin'

  const [teams, setTeams]           = useState([])          // untuk super_admin
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [teamLoading, setTeamLoading] = useState(false)

  // Super admin: fetch semua tim
  useEffect(() => {
    if (!isSuperAdmin) return
    supabase.from('teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data: teamsData }) => {
        const t = teamsData || []
        setTeams(t)
        if (t.length > 0) setActiveTeamId(t[0].id)
      })
  }, [isSuperAdmin])

  // Non-super-admin: ambil team_id dari profil
  useEffect(() => {
    if (isSuperAdmin || !user) return
    supabase.from('users').select('team_id').eq('id', user.id).single()
      .then(({ data: profile }) => {
        if (profile?.team_id) setActiveTeamId(profile.team_id)
        else setLoading(false)
      })
  }, [user, isSuperAdmin])

  // Load analytics tiap kali activeTeamId berubah
  const load = useCallback(async () => {
    if (!activeTeamId) return
    setTeamLoading(true)
    const result = await loadTeamAnalytics(activeTeamId)
    setData(result)
    setLoading(false)
    setTeamLoading(false)
  }, [activeTeamId])

  useEffect(() => { load() }, [load])

  const wrColor = data?.kpi?.wr >= 60 ? 'var(--green)' : data?.kpi?.wr >= 45 ? 'var(--brand)' : 'var(--red)'

  return (
    <DashboardLayout title="Analytics">
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Analytics</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>
          {isSuperAdmin
            ? 'Perbandingan performa antar tim. Pilih tim untuk melihat data detail.'
            : 'Performa tim dan analisis mendalam antar pemain.'}
        </p>
      </div>

      {/* Super admin: team tabs */}
      {isSuperAdmin && teams.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {teams.map(t => (
            <button key={t.id} onClick={() => setActiveTeamId(t.id)}
              style={{
                fontSize:12, fontWeight:600, padding:'6px 16px', borderRadius:8, cursor:'pointer',
                transition:'all 0.15s', fontFamily:'Syne,sans-serif',
                background: activeTeamId === t.id ? 'var(--brand)' : 'var(--bg-elevated)',
                color:      activeTeamId === t.id ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${activeTeamId === t.id ? 'var(--brand)' : 'var(--border-2)'}`,
              }}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {(loading || teamLoading) ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(120px,100%),1fr))', gap:12 }}>
            {[1,2,3,4].map(i => <div key={i} className="card"><Skeleton h={60}/></div>)}
          </div>
          <div className="card"><Skeleton h={200}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:16 }}>
            <div className="card"><Skeleton h={180}/></div>
            <div className="card"><Skeleton h={180}/></div>
          </div>
        </div>
      ) : !data?.hasMatches ? (
        <>
          {/* KPI empty */}
          <div className="card" style={{ marginBottom:16 }}>
            <div className="empty-state">
              <div className="empty-state-icon"><TrendingUp size={18} style={{ color:'var(--text-dim)' }}/></div>
              <p style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>Belum ada data match</p>
              <p style={{ fontSize:12, color:'var(--text-dim)' }}>Tambahkan match di halaman Match Input untuk melihat tren win rate.</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:16 }}>
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Top Performer — KDA</p>
              <div className="empty-state" style={{ padding:'24px 0' }}>
                <div className="empty-state-icon"><Users size={16} style={{ color:'var(--text-dim)' }}/></div>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada statistik pemain</p>
                <p style={{ fontSize:11, color:'var(--text-dim)' }}>Data muncul setelah match input dengan stats pemain.</p>
              </div>
            </div>
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Placement Tournament</p>
              <div className="empty-state" style={{ padding:'24px 0' }}>
                <div className="empty-state-icon"><Trophy size={16} style={{ color:'var(--text-dim)' }}/></div>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada data tournament</p>
                <p style={{ fontSize:11, color:'var(--text-dim)' }}>Tambahkan tournament di halaman Tournaments.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:16 }}>
            <KpiCard label="Total Match"  value={data.kpi.total}            sub="match dimainkan"              color="var(--text-primary)" icon={Shield}  />
            <KpiCard label="Win Rate"     value={`${data.kpi.wr}%`}         sub={`${data.kpi.wins}W / ${data.kpi.losses}L`} color={wrColor} icon={Target} />
            <KpiCard label="Win Streak"   value={`${data.kpi.streak}×`}     sub="beruntun terakhir"            color="var(--green)"         icon={Flame}   />
            <KpiCard label="Tournaments"  value={data.placements.length}     sub="tercatat"                     color="var(--brand)"         icon={Trophy}  />
          </div>

          {/* Win Rate Trend */}
          <div className="card" style={{ marginBottom:16 }}>
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
              Tren Win Rate — 10 Match Terakhir
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.wrData} margin={{ top:4, right:8, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                <XAxis dataKey="match" tick={{ fontSize:11, fill:'var(--text-dim)' }} />
                <YAxis domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-dim)' }} unit="%" />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="wr" stroke="var(--brand)" strokeWidth={2}
                  dot={{ r:3, fill:'var(--brand)' }} activeDot={{ r:5 }} unit="%" name="Win Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:16, marginBottom:16 }}>
            {/* Top Performer */}
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
                Top Performer — KDA
              </p>
              {data.performers.length === 0 ? (
                <div className="empty-state" style={{ padding:'24px 0' }}>
                  <div className="empty-state-icon"><Users size={16} style={{ color:'var(--text-dim)' }}/></div>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada statistik pemain</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {data.performers.map((p, i) => (
                    <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:18, fontSize:10, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', flexShrink:0 }}>#{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{p.name}</p>
                        <p style={{ fontSize:10, color:'var(--text-dim)' }}>
                          {p.lane} · {p.matches}m · {p.mvpCount} MVP
                        </p>
                        <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:1, fontFamily:'IBM Plex Mono,monospace' }}>
                          {p.avgKills}/{p.avgDeaths}/{p.avgAssists}
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

            {/* Tournament */}
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
                Placement Tournament
              </p>
              {!data.hasTournaments ? (
                <div className="empty-state" style={{ padding:'24px 0' }}>
                  <div className="empty-state-icon"><Trophy size={16} style={{ color:'var(--text-dim)' }}/></div>
                  <p style={{ fontSize:12, color:'var(--text-muted)' }}>Belum ada data tournament</p>
                  <p style={{ fontSize:11, color:'var(--text-dim)' }}>Tambahkan tournament di halaman Tournaments.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {data.placements.map((t, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom: i < data.placements.length-1 ? '1px solid var(--border-1)' : 'none' }}>
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

          {/* Lane KDA */}
          {data.roleKda.length > 0 && (
            <div className="card" style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
                KDA Kontribusi per Lane — Identifikasi Kekuatan &amp; Kelemahan
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.roleKda} margin={{ top:4, right:8, bottom:0, left:-20 }} barSize={38}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                  <XAxis dataKey="lane" tick={{ fontSize:12, fill:'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize:11, fill:'var(--text-dim)' }} />
                  <Tooltip
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-2)', borderRadius:8, padding:'8px 12px' }}>
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
                        <p style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>Avg KDA: {payload[0].value}</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="kda" radius={[6,6,0,0]} name="Avg KDA">
                    {data.roleKda.map((_, i) => <Cell key={i} fill={LANE_COLORS[i % LANE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:10 }}>
                💡 Lane dengan KDA rendah = kandidat untuk lebih banyak training atau substitusi.
              </p>
            </div>
          )}

          {/* Hero Usage */}
          {data.heroStats.length > 0 && (
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
                Hero Pool — Paling Sering Dimainkan
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
                {data.heroStats.map((h, i) => (
                  <div key={h.hero} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border-1)' }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.hero}</p>
                    <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:3 }}>{h.count}× pick</p>
                    <div style={{ height:3, background:'var(--border-1)', borderRadius:2, overflow:'hidden', marginTop:6 }}>
                      <div style={{ height:'100%', background: LANE_COLORS[i % LANE_COLORS.length], borderRadius:2, width:`${Math.min((h.count/data.heroStats[0].count)*100,100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:10 }}>
                💡 Hero pool yang sempit = risiko counter-pick. Variasikan hero untuk adaptasi meta.
              </p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}