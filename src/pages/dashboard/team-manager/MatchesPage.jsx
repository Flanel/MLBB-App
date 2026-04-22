import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { CheckCircle } from 'lucide-react'

export default function MatchesPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [players, setPlayers]         = useState([])
  const [teamId, setTeamId]           = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  const [form, setForm] = useState({
    tournament_id: '', tournament: '',
    date: new Date().toISOString().split('T')[0],
    opponent: '', result: 'Win', score: '', round: '',
  })
  const [stats, setStats] = useState([])

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)

      const [{ data: pData }, { data: tData }] = await Promise.all([
        supabase.from('users').select('id,name,lane').eq('team_id', profile.team_id).eq('role','player').eq('is_active',true).order('name'),
        supabase.from('tournaments').select('id,name').eq('team_id', profile.team_id).eq('status','Ongoing'),
      ])

      const plist = pData || []
      setPlayers(plist)
      setTournaments(tData || [])
      setStats(plist.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
      setLoading(false)
    }
    load()
  }, [user])

  function updateStat(idx, field, value) {
    setStats(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!teamId) { addToast({ message: 'Akun kamu tidak terhubung ke tim.', type: 'danger' }); return }
    if (!form.opponent.trim()) { addToast({ message: 'Isi nama lawan.', type: 'danger' }); return }
    setSaving(true)

    const tournName = form.tournament_id
      ? tournaments.find(t => t.id === form.tournament_id)?.name || form.tournament
      : form.tournament

    const { data: match, error } = await supabase.from('matches').insert({
      team_id: teamId,
      tournament_id: form.tournament_id || null,
      tournament: tournName,
      date: form.date,
      opponent: form.opponent,
      result: form.result,
      score: form.score || null,
      round: form.round || null,
      created_by: user.id,
    }).select().single()

    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }); setSaving(false); return }

    const statsToInsert = stats.filter(s => s.hero.trim()).map(s => ({
      match_id: match.id, player_id: s.player_id, hero: s.hero,
      kills: parseInt(s.kills) || 0, deaths: parseInt(s.deaths) || 0,
      assists: parseInt(s.assists) || 0, damage: parseInt(s.damage) || 0, mvp: s.mvp,
    }))

    if (statsToInsert.length) {
      const { error: sErr } = await supabase.from('match_player_stats').insert(statsToInsert)
      if (sErr) addToast({ message: 'Match tersimpan tapi stats gagal.', type: 'warning' })
    }

    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Input match result', target: `vs ${form.opponent}` })
    addToast({ message: `Match vs ${form.opponent} disimpan.`, type: 'success' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    setForm(f => ({ ...f, opponent: '', score: '', round: '', tournament_id: '', tournament: '' }))
    setStats(players.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
    setSaving(false)
  }

  const inputStyle = { padding: '6px 8px', fontSize: 12 }

  if (loading) return <DashboardLayout title="Match Input"><p style={{ fontSize:12, color:'var(--text-dim)', marginTop:16 }}>Memuat...</p></DashboardLayout>

  return (
    <DashboardLayout title="Match Input">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Input Hasil Match</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Catat hasil pertandingan dan statistik per pemain.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Match details */}
        <div className="card" style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Detail Match</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            <div>
              <label className="form-label">Tournament (Ongoing)</label>
              <select className="form-input" value={form.tournament_id}
                onChange={e => { const t = tournaments.find(x => x.id === e.target.value); setForm(f => ({...f, tournament_id: e.target.value, tournament: t?.name || ''})) }}>
                <option value="">— Pilih atau tulis manual —</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Nama Tournament (manual)</label>
              <input className="form-input" placeholder="Tulis nama tournament" value={form.tournament}
                onChange={e => setForm(f => ({...f, tournament: e.target.value, tournament_id: ''}))} />
            </div>
            <div>
              <label className="form-label">Tanggal *</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Lawan *</label>
              <input className="form-input" placeholder="e.g. Red Titans" value={form.opponent}
                onChange={e => setForm(f => ({...f, opponent: e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Hasil</label>
              <select className="form-input" value={form.result} onChange={e => setForm(f => ({...f, result: e.target.value}))}>
                <option value="Win">Menang</option>
                <option value="Loss">Kalah</option>
              </select>
            </div>
            <div>
              <label className="form-label">Skor</label>
              <input className="form-input" placeholder="e.g. 2–1" value={form.score} onChange={e => setForm(f => ({...f, score: e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Babak / Stage</label>
              <input className="form-input" placeholder="e.g. Quarterfinal" value={form.round} onChange={e => setForm(f => ({...f, round: e.target.value}))} />
            </div>
          </div>
        </div>

        {/* Player stats */}
        {players.length > 0 && (
          <div className="card" style={{ marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>
              Statistik Pemain <span style={{ color:'var(--text-dim)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(isi kolom hero untuk menyimpan stats)</span>
            </p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%' }}>
                <thead>
                  <tr>
                    {['Pemain','Hero','K','D','A','Damage','MVP'].map(h => <th key={h} className="table-th">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="table-td">
                        <p style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)' }}>{p.name}</p>
                        <p style={{ fontSize:10, color:'var(--text-dim)' }}>{p.lane}</p>
                      </td>
                      <td className="table-td">
                        <input className="form-input" style={{ ...inputStyle, width:100 }} placeholder="Hero" value={stats[idx]?.hero||''} onChange={e => updateStat(idx,'hero',e.target.value)} />
                      </td>
                      {['kills','deaths','assists'].map(field => (
                        <td key={field} className="table-td">
                          <input className="form-input" style={{ ...inputStyle, width:52, textAlign:'center' }} placeholder="0"
                            value={stats[idx]?.[field]||''} onChange={e => updateStat(idx,field,e.target.value)} type="number" min="0" />
                        </td>
                      ))}
                      <td className="table-td">
                        <input className="form-input" style={{ ...inputStyle, width:90 }} placeholder="0"
                          value={stats[idx]?.damage||''} onChange={e => updateStat(idx,'damage',e.target.value)} type="number" min="0" />
                      </td>
                      <td className="table-td" style={{ textAlign:'center' }}>
                        <input type="checkbox" checked={stats[idx]?.mvp||false}
                          onChange={e => updateStat(idx,'mvp',e.target.checked)}
                          style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--brand)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="card" style={{ marginBottom:14, textAlign:'center', padding:'24px 0' }}>
            <p style={{ fontSize:12, color:'var(--text-dim)' }}>Belum ada pemain aktif di tim. Tambah pemain di halaman Roster terlebih dahulu.</p>
          </div>
        )}

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap:6 }}>
            {saving ? 'Menyimpan...' : 'Simpan Match'}
          </button>
          {saved && (
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--green)' }}>
              <CheckCircle size={13}/> Match tersimpan!
            </span>
          )}
        </div>
      </form>
    </DashboardLayout>
  )
}
