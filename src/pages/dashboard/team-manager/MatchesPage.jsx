import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function MatchesPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [players, setPlayers]         = useState([])
  const [teamId, setTeamId]           = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)

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
        supabase.from('users').select('id,name,lane').eq('team_id', profile.team_id).eq('role','player').eq('is_active',true),
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
    if (!teamId) { addToast({ message: 'No team assigned to your account.', type: 'danger' }); return }
    setSaving(true)

    const { data: match, error } = await supabase.from('matches').insert({
      team_id: teamId, tournament_id: form.tournament_id || null,
      tournament: form.tournament, date: form.date, opponent: form.opponent,
      result: form.result, score: form.score || null, round: form.round || null,
      created_by: user.id,
    }).select().single()

    if (error) { addToast({ message: `Failed: ${error.message}`, type: 'danger' }); setSaving(false); return }

    const statsToInsert = stats.filter(s => s.hero.trim()).map(s => ({
      match_id: match.id, player_id: s.player_id, hero: s.hero,
      kills: parseInt(s.kills)||0, deaths: parseInt(s.deaths)||0,
      assists: parseInt(s.assists)||0, damage: parseInt(s.damage)||0, mvp: s.mvp,
    }))

    if (statsToInsert.length > 0) {
      const { error: sErr } = await supabase.from('match_player_stats').insert(statsToInsert)
      if (sErr) addToast({ message: 'Match saved but stats failed.', type: 'warning' })
    }

    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Added match result', target: `vs ${form.opponent}` })
    addToast({ message: 'Match result saved.', type: 'success' })
    setForm(f => ({ ...f, opponent: '', score: '', round: '', tournament_id: '', tournament: '' }))
    setStats(players.map(p => ({ player_id: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false })))
    setSaving(false)
  }

  if (loading) return <DashboardLayout title="Match Input"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

  return (
    <DashboardLayout title="Match Input">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Add match result</h2>
      <p className="text-xs text-slate-400 mb-4">Record a match result and individual player stats.</p>
      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Match details</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Tournament (ongoing)</label>
              <select className="form-input" value={form.tournament_id} onChange={e => { const t = tournaments.find(x=>x.id===e.target.value); setForm(f=>({...f,tournament_id:e.target.value,tournament:t?.name||''})) }}>
                <option value="">— Select or type below —</option>
                {tournaments.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Or type tournament name</label>
              <input className="form-input" placeholder="Manual entry" value={form.tournament} onChange={e=>setForm(f=>({...f,tournament:e.target.value,tournament_id:''}))} />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Opponent</label>
              <input className="form-input" placeholder="e.g. Red Titans" value={form.opponent} onChange={e=>setForm(f=>({...f,opponent:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Result</label>
              <select className="form-input" value={form.result} onChange={e=>setForm(f=>({...f,result:e.target.value}))}>
                <option>Win</option><option>Loss</option>
              </select>
            </div>
            <div>
              <label className="form-label">Score</label>
              <input className="form-input" placeholder="e.g. 2–1" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Round / Stage</label>
              <input className="form-input" placeholder="e.g. Quarterfinal" value={form.round} onChange={e=>setForm(f=>({...f,round:e.target.value}))} />
            </div>
          </div>
        </div>

        {players.length > 0 && (
          <div className="card mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Player stats</p>
            <table className="w-full">
              <thead><tr>{['Player','Hero','K','D','A','Damage','MVP'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="table-td text-xs">{p.name} <span className="text-slate-400">({p.lane})</span></td>
                    <td className="table-td"><input className="form-input py-1 w-24" placeholder="Hero" value={stats[idx]?.hero||''} onChange={e=>updateStat(idx,'hero',e.target.value)} /></td>
                    <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx]?.kills||''} onChange={e=>updateStat(idx,'kills',e.target.value)} /></td>
                    <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx]?.deaths||''} onChange={e=>updateStat(idx,'deaths',e.target.value)} /></td>
                    <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx]?.assists||''} onChange={e=>updateStat(idx,'assists',e.target.value)} /></td>
                    <td className="table-td"><input className="form-input py-1 w-24" placeholder="0" value={stats[idx]?.damage||''} onChange={e=>updateStat(idx,'damage',e.target.value)} /></td>
                    <td className="table-td"><input type="checkbox" checked={stats[idx]?.mvp||false} onChange={e=>updateStat(idx,'mvp',e.target.checked)} className="cursor-pointer" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':'Save match'}</button>
          <button type="button" className="btn">Cancel</button>
        </div>
      </form>
    </DashboardLayout>
  )
}
