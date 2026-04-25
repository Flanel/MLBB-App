import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Users, Trophy } from 'lucide-react'

// FIX: slice(-12) → slice(-10) agar konsisten dengan label "10 Match Terakhir"

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 12, color: p.color }}>{p.name}: {p.value}{p.unit || ''}</p>
      ))}
    </div>
  )
}

function SkeletonBlock({ w = '100%', h = 16 }) {
  return <div className="skeleton" style={{ width: w, height: h }} />
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [wrData, setWrData]         = useState([])
  const [performers, setPerformers] = useState([])
  const [placements, setPlacements] = useState([])
  const [loading, setLoading]       = useState(true)
  const [hasMatches, setHasMatches] = useState(false)
  const [hasPlayers, setHasPlayers] = useState(false)
  const [hasTournaments, setHasTournaments] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase
        .from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      const tid = profile.team_id

      const [
        { data: matchData },
        { data: tournData },
        { data: matchIds },
      ] = await Promise.all([
        supabase.from('matches')
          .select('id, result, date')
          .eq('team_id', tid)
          .order('date')
          .limit(30),
        supabase.from('tournaments')
          .select('name, placement, status')
          .eq('team_id', tid)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('matches')
          .select('id')
          .eq('team_id', tid),
      ])

      const mx = matchData || []
      setHasMatches(mx.length > 0)
      if (mx.length > 0) {
        const wrSeries = mx.map((m, i) => {
          const slice = mx.slice(0, i + 1)
          const wins = slice.filter(x => x.result === 'Win').length
          return { match: `M${i + 1}`, wr: Math.round((wins / slice.length) * 100) }
        })
        // FIX: slice(-10) bukan slice(-12) — label di UI sudah bertuliskan "10 Match Terakhir"
        setWrData(wrSeries.slice(-10))
      }

      const ids = (matchIds || []).map(m => m.id)
      if (ids.length > 0) {
        const { data: playerStats } = await supabase
          .from('match_player_stats')
          .select('player_id, kills, deaths, assists, users(name, lane)')
          .in('match_id', ids)

        const byPlayer = {}
        ;(playerStats || []).forEach(s => {
          const name = s.users?.name || 'Unknown'
          const lane = s.users?.lane || '?'
          if (!byPlayer[name]) byPlayer[name] = { name, lane, kills: 0, deaths: 0, assists: 0, count: 0 }
          byPlayer[name].kills   += s.kills
          byPlayer[name].deaths  += s.deaths
          byPlayer[name].assists += s.assists
          byPlayer[name].count++
        })
        const perf = Object.values(byPlayer).map(p => ({
          name: p.name, lane: p.lane,
          kda: p.deaths === 0
            ? (p.kills + p.assists).toFixed(1)
            : ((p.kills + p.assists) / p.deaths).toFixed(2),
        })).sort((a, b) => b.kda - a.kda).slice(0, 5)

        if (perf.length > 0) {
          setHasPlayers(true)
          setPerformers(perf)
        }
      }

      if (tournData?.length > 0) {
        setHasTournaments(true)
        setPlacements(tournData)
      }

      setLoading(false)
    }
    load()
  }, [user])

  return (
    <DashboardLayout title="Analytics">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Analytics</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Performa tim dan perbandingan antar pemain.</p>
      </div>

      {/* Win Rate Trend */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>
          Tren Win Rate — 10 Match Terakhir
        </p>
        {loading ? (
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonBlock h={160} />
          </div>
        ) : !hasMatches ? (
          <div className="empty-state">
            <div className="empty-state-icon"><TrendingUp size={18} style={{ color: 'var(--text-dim)' }} /></div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada data match</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Tambahkan match di halaman Match Input untuk melihat tren win rate.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={wrData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
              <XAxis dataKey="match" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-dim)' }} unit="%" />
              <Tooltip content={<TT />} />
              <Line
                type="monotone" dataKey="wr" stroke="var(--brand)" strokeWidth={2}
                dot={{ r: 3, fill: 'var(--brand)' }} activeDot={{ r: 5 }} unit="%" name="Win Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* KDA Performers */}
        <div className="card">
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>
            Top Performer — KDA
          </p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <SkeletonBlock key={i} h={32} />)}
            </div>
          ) : !hasPlayers ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon"><Users size={16} style={{ color: 'var(--text-dim)' }} /></div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada statistik pemain</p>
              <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Data muncul setelah match input dengan stats pemain.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {performers.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 18, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'IBM Plex Mono,monospace', flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{p.lane}</p>
                  </div>
                  <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{p.kda}</span>
                  <div style={{ width: 64, height: 4, background: 'var(--border-1)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', background: 'var(--brand)', borderRadius: 2, width: `${Math.min((parseFloat(p.kda) / 8) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Placements */}
        <div className="card">
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>
            Placement Tournament
          </p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <SkeletonBlock key={i} h={36} />)}
            </div>
          ) : !hasTournaments ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon"><Trophy size={16} style={{ color: 'var(--text-dim)' }} /></div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada data tournament</p>
              <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Tambahkan tournament di halaman Tournaments.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {placements.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: i < placements.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.name}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {t.placement && <span className="badge badge-green">{t.placement}</span>}
                    <span className={`badge ${t.status === 'Ongoing' ? 'badge-ocean' : 'badge-slate'}`}>{t.status}</span>
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