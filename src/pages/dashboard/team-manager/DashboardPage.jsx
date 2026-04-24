// FIX BUG #3: Supabase { count: 'exact', head: true } mengembalikan data: null.
// Sebelumnya: playerData?.length dan tournData?.length → selalu 0.
// Fix: destructure `count` langsung dari response.

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import KpiCard from '@/components/ui/KpiCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, Users, Swords, Trophy } from 'lucide-react'

export default function TmDashboardPage() {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState('Tim Kamu')
  const [matches, setMatches]   = useState([])
  const [stats, setStats]       = useState({ winRate: 0, total: 0, players: 0, tournaments: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase
        .from('users').select('team_id, teams(name)').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }

      const tid = profile.team_id
      setTeamName(profile.teams?.name || 'Tim Kamu')

      // FIX BUG #3: destructure `count` bukan `data` untuk head:true queries
      const [
        { data: matchData },
        { count: playersCount },
        { count: tournamentsCount },
      ] = await Promise.all([
        supabase.from('matches')
          .select('result, opponent, tournament, date')
          .eq('team_id', tid).order('date', { ascending: false }).limit(10),
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', tid).eq('role', 'player'),
        supabase.from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', tid),
      ])

      const mx   = matchData || []
      const wins = mx.filter(m => m.result === 'Win').length
      setMatches(mx)
      setStats({
        winRate:     mx.length ? Math.round((wins / mx.length) * 100) : 0,
        total:       mx.length,
        players:     playersCount     || 0,  // ✓ angka benar
        tournaments: tournamentsCount || 0,  // ✓ angka benar
      })
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <DashboardLayout title={teamName} subtitle="Team Manager Dashboard">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Dashboard</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Ringkasan performa tim {teamName}.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="Win Rate"     value={loading ? '—' : `${stats.winRate}%`} sub="Dari semua match" variant="up"      icon={TrendingUp} />
        <KpiCard label="Total Match"  value={loading ? '—' : stats.total}         sub="Season ini"      variant="neutral" icon={Swords} />
        <KpiCard label="Pemain Aktif" value={loading ? '—' : stats.players}                             variant="neutral" icon={Users} />
        <KpiCard label="Tournament"   value={loading ? '—' : stats.tournaments}                         variant="neutral" icon={Trophy} />
      </div>

      <div className="card">
        <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Match Terbaru</p>
        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</p>
        ) : matches.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Belum ada match. Input pertama di halaman Match Input.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%' }}>
              <thead>
                <tr>{['Lawan','Hasil','Tournament','Tanggal'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr key={i}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{m.opponent}</td>
                    <td className="table-td"><span className={`badge ${m.result==='Win'?'badge-green':'badge-red'}`}>{m.result}</span></td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{m.tournament||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>{m.date}</td>
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
