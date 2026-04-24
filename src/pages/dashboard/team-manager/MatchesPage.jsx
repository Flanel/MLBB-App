// MatchesPage.jsx — 2 Tab: Tournament Match & Match Biasa + Schedule Integration
//
// FITUR BARU vs versi sebelumnya:
// ─────────────────────────────────────────────────────────────────
// 1. TAB "Tournament" — Input match yang terhubung ke tournament aktif
// 2. TAB "Match Biasa" — Input match tanpa tournament (scrimmage, dll)
// 3. TAB "Riwayat" — Lihat semua match: menang/kalah, MVP, jumlah match,
//                    dengan filter berdasarkan tournament / semua
// 4. Semua member aktif (semua role) bisa dimasukkan ke player stats
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { CheckCircle, Trophy, Swords, History, Star, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Filter } from 'lucide-react'

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      fontFamily: 'Syne,sans-serif', cursor: 'pointer', transition: 'all 0.15s',
      border: active ? '1px solid rgba(225,29,72,0.3)' : '1px solid var(--border-1)',
      background: active ? 'var(--brand-glow)' : 'var(--bg-surface)',
      color: active ? 'var(--red)' : 'var(--text-muted)',
    }}>
      <Icon size={13} />
      {label}
      {count != null && (
        <span style={{
          background: active ? 'rgba(225,29,72,0.2)' : 'var(--bg-elevated)',
          color: active ? 'var(--red)' : 'var(--text-dim)',
          fontSize: 10, fontWeight: 700, borderRadius: 5,
          padding: '1px 5px', fontFamily: 'IBM Plex Mono,monospace',
        }}>{count}</span>
      )}
    </button>
  )
}

// ── Match Form (shared between Tournament & Biasa) ────────────────────────────
function MatchForm({ teamId, isTournament, tournaments, players, user, addToast, onSuccess }) {
  const [form, setForm] = useState({
    tournament_id: '', tournament: '',
    date:          new Date().toISOString().split('T')[0],
    opponent: '', result: 'Win', score: '', round: '',
  })
  const [stats, setStats]   = useState(players.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  // Sync stats jika players berubah
  useEffect(() => {
    setStats(players.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
  }, [players])

  function updateStat(idx, field, value) {
    setStats(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!teamId)            { addToast({ message: 'Akun belum terhubung ke tim.', type: 'danger' }); return }
    if (!form.opponent.trim()) { addToast({ message: 'Isi nama lawan.', type: 'danger' }); return }
    if (isTournament && !form.tournament_id && !form.tournament.trim()) {
      addToast({ message: 'Pilih atau isi nama tournament.', type: 'danger' }); return
    }
    setSaving(true)

    const tournName = form.tournament_id
      ? tournaments.find(t => t.id === form.tournament_id)?.name || form.tournament
      : form.tournament

    const { data: match, error } = await supabase.from('matches').insert({
      team_id:       teamId,
      tournament_id: form.tournament_id || null,
      tournament:    tournName || null,
      date:          form.date,
      opponent:      form.opponent,
      result:        form.result,
      score:         form.score || null,
      round:         form.round || null,
      created_by:    user.id,
    }).select().single()

    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }); setSaving(false); return }

    const statsToInsert = stats.filter(s => s.hero.trim()).map(s => ({
      match_id: match.id, player_id: s.player_id, hero: s.hero,
      kills:    parseInt(s.kills)   || 0,
      deaths:   parseInt(s.deaths)  || 0,
      assists:  parseInt(s.assists) || 0,
      damage:   parseInt(s.damage)  || 0,
      mvp:      s.mvp,
    }))

    if (statsToInsert.length) {
      const { error: sErr } = await supabase.from('match_player_stats').insert(statsToInsert)
      if (sErr) addToast({ message: 'Match tersimpan tapi stats gagal disimpan.', type: 'warning' })
    }

    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Input match result', target: `vs ${form.opponent}` })
    addToast({ message: `Match vs ${form.opponent} disimpan!`, type: 'success' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    setForm(f => ({ ...f, opponent: '', score: '', round: '', tournament_id: '', tournament: '' }))
    setStats(players.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
    setSaving(false)
    onSuccess?.()
  }

  const inp = { padding: '6px 8px', fontSize: 12 }

  return (
    <form onSubmit={handleSubmit}>
      {/* Detail Match */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>
          {isTournament ? '🏆 Detail Match Tournament' : '⚔️ Detail Match Biasa / Scrim'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {isTournament && (
            <>
              <div>
                <label className="form-label">Tournament (Ongoing)</label>
                <select className="form-input" value={form.tournament_id}
                  onChange={e => {
                    const t = tournaments.find(x => x.id === e.target.value)
                    setForm(f => ({ ...f, tournament_id: e.target.value, tournament: t?.name || '' }))
                  }}>
                  <option value="">— Pilih tournament —</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Atau tulis manual</label>
                <input className="form-input" placeholder="Nama tournament"
                  value={form.tournament}
                  onChange={e => setForm(f => ({ ...f, tournament: e.target.value, tournament_id: '' }))} />
              </div>
              <div>
                <label className="form-label">Babak / Stage</label>
                <input className="form-input" placeholder="e.g. Quarterfinal" value={form.round}
                  onChange={e => setForm(f => ({ ...f, round: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <label className="form-label">Tanggal *</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Lawan *</label>
            <input className="form-input" placeholder="e.g. Red Titans" value={form.opponent}
              onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Hasil</label>
            <select className="form-input" value={form.result}
              onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
              <option value="Win">Menang</option>
              <option value="Loss">Kalah</option>
            </select>
          </div>
          <div>
            <label className="form-label">Skor</label>
            <input className="form-input" placeholder="e.g. 2–1" value={form.score}
              onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Player Stats */}
      {players.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 14, fontFamily: 'Syne,sans-serif' }}>
            Statistik Pemain <span style={{ color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(isi hero untuk simpan stats)</span>
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>{['Pemain', 'Hero', 'K', 'D', 'A', 'Damage', 'MVP'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="table-td">
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{p.lane || p.role}</p>
                    </td>
                    <td className="table-td">
                      <input className="form-input" style={{ ...inp, width: 100 }} placeholder="Hero"
                        value={stats[idx]?.hero || ''} onChange={e => updateStat(idx, 'hero', e.target.value)} />
                    </td>
                    {['kills', 'deaths', 'assists'].map(field => (
                      <td key={field} className="table-td">
                        <input className="form-input" style={{ ...inp, width: 52, textAlign: 'center' }} placeholder="0" type="number" min="0"
                          value={stats[idx]?.[field] || ''} onChange={e => updateStat(idx, field, e.target.value)} />
                      </td>
                    ))}
                    <td className="table-td">
                      <input className="form-input" style={{ ...inp, width: 90 }} placeholder="0" type="number" min="0"
                        value={stats[idx]?.damage || ''} onChange={e => updateStat(idx, 'damage', e.target.value)} />
                    </td>
                    <td className="table-td" style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={stats[idx]?.mvp || false}
                        onChange={e => updateStat(idx, 'mvp', e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: 6 }}>
          {saving ? 'Menyimpan...' : 'Simpan Match'}
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
            <CheckCircle size={13} /> Match tersimpan!
          </span>
        )}
      </div>
    </form>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ teamId, players, tournaments }) {
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all') // 'all' | tournament_id | 'regular'
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!teamId) return
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('matches')
        .select('*, match_player_stats(*, users(name, lane, role))')
        .eq('team_id', teamId)
        .order('date', { ascending: false })
      setMatches(data || [])
      setLoading(false)
    }
    load()
  }, [teamId])

  const filtered = matches.filter(m => {
    if (filter === 'all')     return true
    if (filter === 'regular') return !m.tournament_id && !m.tournament
    return m.tournament_id === filter || m.tournament === filter
  })

  const wins   = filtered.filter(m => m.result === 'Win').length
  const losses = filtered.filter(m => m.result === 'Loss').length
  const wr     = filtered.length ? Math.round((wins / filtered.length) * 100) : null

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Match', val: filtered.length, color: 'var(--text-primary)' },
          { label: 'Menang',      val: wins,            color: 'var(--green)' },
          { label: 'Kalah',       val: losses,          color: 'var(--red)' },
          { label: 'Win Rate',    val: wr != null ? `${wr}%` : '—', color: wr >= 50 ? 'var(--green)' : wr != null ? 'var(--red)' : 'var(--text-dim)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 14px' }}>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: s.color }}>{s.val}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn btn-primary' : 'btn'}
          style={{ fontSize: 11, padding: '5px 10px', gap: 5 }}>
          <Filter size={10} /> Semua
        </button>
        <button onClick={() => setFilter('regular')}
          className={filter === 'regular' ? 'btn btn-primary' : 'btn'}
          style={{ fontSize: 11, padding: '5px 10px', gap: 5 }}>
          <Swords size={10} /> Match Biasa
        </button>
        {tournaments.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={filter === t.id ? 'btn btn-primary' : 'btn'}
            style={{ fontSize: 11, padding: '5px 10px', gap: 5 }}>
            <Trophy size={10} /> {t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 12 }}>Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
          <History size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada match tercatat.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(m => {
            const isWin    = m.result === 'Win'
            const mvpStat  = m.match_player_stats?.find(s => s.mvp)
            const isExpand = expanded === m.id
            return (
              <div key={m.id} className="card" style={{ borderLeft: `3px solid ${isWin ? 'var(--green)' : 'var(--red)'}`, paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                  onClick={() => setExpanded(v => v === m.id ? null : m.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      {/* Result badge */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                        background: isWin ? 'rgba(34,197,94,0.15)' : 'rgba(225,29,72,0.15)',
                        color: isWin ? 'var(--green)' : 'var(--red)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {isWin ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {isWin ? 'MENANG' : 'KALAH'}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>vs {m.opponent}</p>
                      {m.score && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.score}</span>}
                      {m.tournament && (
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 5,
                          background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <Trophy size={9} /> {m.tournament}
                          {m.round && ` · ${m.round}`}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-dim)', alignItems: 'center' }}>
                      <span>{new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {mvpStat && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                          <Star size={10} fill="#f59e0b" /> MVP: {mvpStat.users?.name || '—'} ({mvpStat.hero})
                        </span>
                      )}
                      {m.match_player_stats?.length > 0 && (
                        <span>{m.match_player_stats.length} pemain tercatat</span>
                      )}
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}>
                    {isExpand ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded: player stats */}
                {isExpand && m.match_player_stats?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-1)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>{['Pemain', 'Hero', 'K', 'D', 'A', 'Damage', ''].map((h, i) => (
                            <th key={i} className="table-th" style={{ fontSize: 10 }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {m.match_player_stats.map(s => (
                            <tr key={s.id} style={{ background: s.mvp ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                              <td className="table-td">
                                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.users?.name || '—'}</p>
                                <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>{s.users?.lane || s.users?.role}</p>
                              </td>
                              <td className="table-td" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.hero}</td>
                              <td className="table-td" style={{ fontSize: 12, textAlign: 'center', color: 'var(--green)' }}>{s.kills}</td>
                              <td className="table-td" style={{ fontSize: 12, textAlign: 'center', color: 'var(--red)' }}>{s.deaths}</td>
                              <td className="table-td" style={{ fontSize: 12, textAlign: 'center', color: '#38bdf8' }}>{s.assists}</td>
                              <td className="table-td" style={{ fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-dim)' }}>
                                {s.damage?.toLocaleString() || 0}
                              </td>
                              <td className="table-td" style={{ textAlign: 'center' }}>
                                {s.mvp && <Star size={13} fill="#f59e0b" style={{ color: '#f59e0b' }} />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [teamId, setTeamId]           = useState(null)
  const [players, setPlayers]         = useState([])
  const [tournaments, setTournaments] = useState([])
  const [allTournaments, setAllTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('tournament') // 'tournament' | 'regular' | 'history'
  const [historyKey, setHistoryKey]   = useState(0)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)

      const [{ data: pData }, { data: tOngoing }, { data: tAll }] = await Promise.all([
        // PERUBAHAN: semua member aktif bisa masuk ke stats, bukan hanya role='player'
        supabase.from('users').select('id,name,lane,role').eq('team_id', profile.team_id).eq('is_active', true).order('name'),
        supabase.from('tournaments').select('id,name').eq('team_id', profile.team_id).eq('status', 'Ongoing'),
        supabase.from('tournaments').select('id,name').eq('team_id', profile.team_id).order('name'),
      ])

      setPlayers(pData || [])
      setTournaments(tOngoing || [])
      setAllTournaments(tAll || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <DashboardLayout title="Match Input">
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16 }}>Memuat...</p>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Match Input">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
          Match Input
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Catat hasil pertandingan tournament, match biasa/scrim, dan lihat riwayat lengkap.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'tournament'} onClick={() => setTab('tournament')} icon={Trophy}  label="Tournament" />
        <TabBtn active={tab === 'regular'}    onClick={() => setTab('regular')}    icon={Swords}  label="Match Biasa / Scrim" />
        <TabBtn active={tab === 'history'}    onClick={() => setTab('history')}    icon={History} label="Riwayat" count={null} />
      </div>

      {/* Tournament Tab */}
      {tab === 'tournament' && (
        <div>
          {tournaments.length === 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Trophy size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.5 }}>
                Tidak ada tournament yang sedang berjalan. Kamu tetap bisa tulis nama tournament secara manual, atau buat tournament baru di halaman Tournaments.
              </p>
            </div>
          )}
          <MatchForm
            key="tournament"
            teamId={teamId}
            isTournament={true}
            tournaments={tournaments}
            players={players}
            user={user}
            addToast={addToast}
            onSuccess={() => setHistoryKey(k => k + 1)}
          />
        </div>
      )}

      {/* Regular Tab */}
      {tab === 'regular' && (
        <div>
          <div style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Swords size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--brand)', lineHeight: 1.5 }}>
              Match biasa untuk scrim, ranked, atau pertandingan non-tournament. Data ini tetap masuk ke statistik dan party win rate.
            </p>
          </div>
          <MatchForm
            key="regular"
            teamId={teamId}
            isTournament={false}
            tournaments={[]}
            players={players}
            user={user}
            addToast={addToast}
            onSuccess={() => setHistoryKey(k => k + 1)}
          />
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <HistoryTab
          key={historyKey}
          teamId={teamId}
          players={players}
          tournaments={allTournaments}
        />
      )}
    </DashboardLayout>
  )
}