import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-2)', borderRadius:8, padding:'8px 12px' }}>
      <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ fontSize:12, color: p.color }}>{p.name}: {p.value}{p.unit||''}</p>)}
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [wrData, setWrData]         = useState([])
  const [performers, setPerformers] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      const tid = profile.team_id

      const [{ data: matchData }, { data: playerStats }, { data: tournData }] = await Promise.all([
        supabase.from('matches').select('result, date').eq('team_id', tid).order('date').limit(20),
        supabase.from('match_player_stats').select('player_id, kills, deaths, assists, users(name, lane)').eq('match_id', tid),
        supabase.from('tournaments').select('name, placement, status').eq('team_id', tid).order('created_at', { ascending: false }).limit(5),
      ])

      // Build rolling win-rate series
      const mx = matchData || []
      const wrSeries = mx.map((m, i) => {
        const slice = mx.slice(0, i + 1)
        const wins = slice.filter(x => x.result === 'Win').length
        return { match: `M${i+1}`, wr: Math.round((wins / slice.length) * 100) }
      })
      setWrData(wrSeries.slice(-12))

      // Aggregate player KDA
      const byPlayer = {}
      ;(playerStats || []).forEach(s => {
        const name = s.users?.name || 'Unknown'
        const lane = s.users?.lane || '?'
        if (!byPlayer[name]) byPlayer[name] = { name, lane, kills:0, deaths:0, assists:0, count:0 }
        byPlayer[name].kills   += s.kills
        byPlayer[name].deaths  += s.deaths
        byPlayer[name].assists += s.assists
        byPlayer[name].count++
      })
      const perf = Object.values(byPlayer).map(p => ({
        name: p.name, lane: p.lane,
        kda: p.deaths === 0 ? (p.kills + p.assists).toFixed(1) : ((p.kills + p.assists) / p.deaths).toFixed(2)
      })).sort((a,b) => b.kda - a.kda).slice(0, 5)
      setPerformers(perf.length ? perf : [
        { name:'Fajar M.', lane:'Mid',       kda:'5.2' },
        { name:'Reza P.',  lane:'Gold Lane', kda:'4.8' },
        { name:'Aldo F.',  lane:'Jungle',    kda:'4.1' },
        { name:'Dito S.',  lane:'Exp Lane',  kda:'3.9' },
        { name:'Bima R.',  lane:'Roam',      kda:'2.8' },
      ])

      setPlacements(tournData?.length ? tournData : [
        { name:'MPL ID S15',    placement:'4th / 8',  status:'Completed' },
        { name:'MDL S8',        placement:'Top 8',    status:'Ongoing' },
        { name:'ML Weekly #24', placement:'2nd / 12', status:'Completed' },
      ])
      setLoading(false)
    }
    load()
  }, [user])

  const fallbackWR = [
    {match:'M1',wr:50},{match:'M2',wr:60},{match:'M3',wr:55},{match:'M4',wr:65},
    {match:'M5',wr:62},{match:'M6',wr:68},{match:'M7',wr:70},{match:'M8',wr:66},
    {match:'M9',wr:72},{match:'M10',wr:68},
  ]

  return (
    <DashboardLayout title="Analytics">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Analytics</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Performa tim dan perbandingan antar pemain.</p>
      </div>

      {/* Win Rate Trend */}
      <div className="card" style={{ marginBottom:16 }}>
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Tren Win Rate — 10 Match Terakhir</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={wrData.length ? wrData : fallbackWR} margin={{ top:4, right:8, bottom:0, left:-20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="match" tick={{ fontSize:11, fill:'var(--text-dim)' }} />
            <YAxis domain={[30,100]} tick={{ fontSize:11, fill:'var(--text-dim)' }} unit="%" />
            <Tooltip content={<TT />} />
            <Line type="monotone" dataKey="wr" stroke="var(--ocean-400)" strokeWidth={2} dot={{ r:3, fill:'var(--ocean-400)' }} activeDot={{ r:5 }} unit="%" name="Win Rate" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* KDA chart */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Top Performer — KDA</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {performers.map((p, i) => (
              <div key={p.name} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:18, fontSize:10, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', flexShrink:0 }}>#{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{p.name}</p>
                  <p style={{ fontSize:10, color:'var(--text-dim)' }}>{p.lane}</p>
                </div>
                <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:13, fontWeight:600, color:'var(--ocean-300)' }}>{p.kda}</span>
                <div style={{ width:64, height:4, background:'var(--border-1)', borderRadius:2, overflow:'hidden', flexShrink:0 }}>
                  <div style={{ height:'100%', background:'var(--ocean-400)', borderRadius:2, width:`${Math.min((parseFloat(p.kda)/8)*100,100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament placements */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Placement Tournament</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {placements.map((t, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom: i < placements.length-1 ? '1px solid var(--border-1)' : 'none' }}>
                <p style={{ fontSize:13, color:'var(--text-secondary)' }}>{t.name}</p>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {t.placement ? <span className="badge badge-green">{t.placement}</span> : null}
                  <span className={`badge ${t.status==='Ongoing'?'badge-ocean':'badge-slate'}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
