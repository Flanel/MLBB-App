// WinRatePage.jsx — Updated: semua role bisa masuk sebagai player
//
// PERUBAHAN dari versi sebelumnya:
// ─────────────────────────────────────────────────────────────────
// SEBELUM: hanya query user dengan role='player'
//   → team_manager, staff tidak muncul di roster party win rate
//
// SEKARANG: query semua member aktif di team (tanpa filter role)
//   → team_manager, staff, player SEMUA masuk ke daftar "Pemain"
//   → Ini sesuai realitas: semua yang main MLBB adalah player juga
//
// FIX: teamId sekarang disimpan di state dan dipakai langsung di calcCombo
//   → Sebelumnya calcCombo fetch ulang team_id dari DB setiap kali pemain dipilih
//   → Redundant DB call, memperlambat response combo analysis
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { User, TrendingUp, Shield, UserCog, Users } from 'lucide-react'

const PARTY_COLORS = {
  'Solo (1)':  '#f43f5e',
  'Duo (2)':   '#e11d48',
  'Trio (3)':  '#7c3aed',
  'Squad (4)': '#0d9488',
  'Party (5)': '#2dd4bf',
}

const ROLE_BADGE = {
  super_admin:  { label: 'SA',      color: '#f43f5e' },
  team_manager: { label: 'Manager', color: '#38bdf8' },
  staff:        { label: 'Staff',   color: '#f59e0b' },
  player:       { label: 'Player',  color: '#22c55e' },
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 14px', minWidth: 140 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: d.fill || 'var(--red)', fontFamily: 'IBM Plex Mono,monospace' }}>{d.value}% WR</p>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{payload[0]?.payload?.games} game</p>
    </div>
  )
}

function SkeletonBlock({ w = '100%', h = 16 }) {
  return <div className="skeleton" style={{ width: w, height: h }} />
}

export default function WinRatePage() {
  const { user }      = useAuth()
  const [data, setData]             = useState([])
  const [players, setPlayers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState([])
  const [hasData, setHasData]       = useState(false)
  const [comboPairData, setComboPairData] = useState(null)
  // FIX: simpan teamId di state agar calcCombo tidak perlu fetch ulang dari DB
  const [teamId, setTeamId]         = useState(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase
        .from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      const tid = profile.team_id
      // FIX: simpan teamId ke state
      setTeamId(tid)

      const [{ data: matchData }, { data: playerData }] = await Promise.all([
        supabase.from('matches')
          .select('id, result, match_player_stats(player_id)')
          .eq('team_id', tid),
        supabase.from('users')
          .select('id, name, lane, role')
          .eq('team_id', tid)
          .eq('is_active', true)
          .order('name'),
      ])

      setPlayers(playerData || [])

      const partyStats = { 1: { wins: 0, total: 0 }, 2: { wins: 0, total: 0 }, 3: { wins: 0, total: 0 }, 4: { wins: 0, total: 0 }, 5: { wins: 0, total: 0 } }
      ;(matchData || []).forEach(m => {
        const size = Math.min(m.match_player_stats?.length || 5, 5)
        if (size >= 1 && size <= 5) {
          partyStats[size].total++
          if (m.result === 'Win') partyStats[size].wins++
        }
      })

      const realDataExists = Object.values(partyStats).some(s => s.total > 0)
      setHasData(realDataExists)

      if (realDataExists) {
        const labels   = { 1: 'Solo (1)', 2: 'Duo (2)', 3: 'Trio (3)', 4: 'Squad (4)', 5: 'Party (5)' }
        const chartData = [1, 2, 3, 4, 5]
          .filter(n => partyStats[n].total > 0)
          .map(n => ({
            name:  labels[n],
            wr:    Math.round((partyStats[n].wins / partyStats[n].total) * 100),
            games: partyStats[n].total,
            wins:  partyStats[n].wins,
          }))
        setData(chartData)
      }

      setLoading(false)
    }
    load()
  }, [user])

  // FIX: gunakan teamId dari state — tidak perlu fetch ulang ke DB setiap kali combo berubah
  useEffect(() => {
    if (selected.length < 2) { setComboPairData(null); return }
    if (!teamId) return

    async function calcCombo() {
      const { data: matchData } = await supabase
        .from('matches')
        .select('id, result, match_player_stats(player_id)')
        .eq('team_id', teamId)

      let wins = 0, total = 0
      ;(matchData || []).forEach(m => {
        const ids = (m.match_player_stats || []).map(s => s.player_id)
        const allPresent = selected.every(id => ids.includes(id))
        if (allPresent) {
          total++
          if (m.result === 'Win') wins++
        }
      })
      setComboPairData({ wins, total, wr: total ? Math.round((wins / total) * 100) : null })
    }
    calcCombo()
  }, [selected, teamId])

  function togglePlayer(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 5))
  }

  const bestParty = data.length ? data.reduce((a, b) => a.wr > b.wr ? a : b, data[0]) : null

  return (
    <DashboardLayout title="Party Win Rate">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Party Win Rate</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Analisis win rate berdasarkan ukuran party. Semua member tim bisa dipilih — termasuk manager & staff yang ikut bermain.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SkeletonBlock h={10} w="60%" />
                <SkeletonBlock h={28} w="50%" />
                <SkeletonBlock h={10} w="70%" />
              </div>
            ))}
          </div>
          <div className="card"><SkeletonBlock h={220} /></div>
        </div>
      ) : !hasData ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="empty-state">
            <div className="empty-state-icon"><TrendingUp size={18} style={{ color: 'var(--text-dim)' }} /></div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Belum ada data match</p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 320 }}>
              Data party win rate akan muncul setelah match diinput beserta statistik pemain per match.
            </p>
          </div>
        </div>
      ) : (
        <>
          {bestParty && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ borderColor: 'var(--brand-border)', background: 'rgba(45,212,191,0.04)' }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 8, fontFamily: 'Syne,sans-serif' }}>🏆 Best Party Size</p>
                <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-primary)' }}>{bestParty.name}</p>
                <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>{bestParty.wr}% WR dari {bestParty.games} game</p>
              </div>
              {data.map(d => (
                <div key={d.name} className="card">
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Syne,sans-serif' }}>{d.name}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: PARTY_COLORS[d.name] || 'var(--text-primary)' }}>{d.wr}%</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{d.wins}W / {d.games - d.wins}L</p>
                </div>
              ))}
            </div>
          )}
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>Win Rate per Party Size</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-dim)' }} unit="%" />
                <Tooltip content={<TT />} cursor={{ fill: 'rgba(45,212,191,0.04)' }} />
                <Bar dataKey="wr" radius={[6, 6, 0, 0]}>
                  {data.map((entry, i) => <Cell key={i} fill={PARTY_COLORS[entry.name] || 'var(--brand)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Player pair analysis */}
      <div className="card">
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 4, fontFamily: 'Syne,sans-serif' }}>
          Analisis Kombinasi Pemain
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Pilih 2–5 member (semua role) untuk melihat win rate saat bermain bersama.
        </p>

        {loading ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3].map(i => <SkeletonBlock key={i} w={100} h={32} />)}
          </div>
        ) : players.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Belum ada member di tim.</p>
        ) : (
          <>
            {/* Role legend */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {Object.entries(ROLE_BADGE).filter(([r]) => players.some(p => p.role === r)).map(([r, badge]) => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.color }} />
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{badge.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {players.map(p => {
                const badge = ROLE_BADGE[p.role] || ROLE_BADGE.player
                const sel   = selected.includes(p.id)
                return (
                  <button key={p.id} onClick={() => togglePlayer(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, padding: '5px 10px', borderRadius: 7,
                      border: `1px solid ${sel ? badge.color + '80' : 'var(--border-1)'}`,
                      background: sel ? badge.color + '18' : 'var(--bg-surface)',
                      color: sel ? badge.color : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    <User size={11} />
                    {p.name}
                    <span style={{ fontSize: 9, opacity: 0.7 }}>
                      ({p.lane || badge.label})
                    </span>
                  </button>
                )
              })}
            </div>

            {selected.length >= 2 && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Kombinasi: {selected.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(' + ')}
                </p>
                {comboPairData ? (
                  comboPairData.total === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Belum ada match bersama yang tercatat.</p>
                  ) : (
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Win Rate Bersama</p>
                        <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: comboPairData.wr >= 50 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                          {comboPairData.wr}%
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Record</p>
                        <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-primary)', marginTop: 2 }}>
                          {comboPairData.wins}W / {comboPairData.total - comboPairData.wins}L
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{comboPairData.total} match bersama</p>
                      </div>
                    </div>
                  )
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Menghitung...</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}