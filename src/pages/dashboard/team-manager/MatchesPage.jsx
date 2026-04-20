import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

const PLAYERS = [
  { id: 'p1', name: 'Reza P.',  lane: 'Gold Lane' },
  { id: 'p2', name: 'Dito S.',  lane: 'Exp Lane'  },
  { id: 'p3', name: 'Fajar M.', lane: 'Mid'       },
  { id: 'p4', name: 'Aldo F.',  lane: 'Jungle'    },
  { id: 'p5', name: 'Bima R.',  lane: 'Roam'      },
]

export default function MatchesPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState({
    tournament: 'ML Weekly Cup #24', date: new Date().toISOString().split('T')[0],
    opponent: '', result: 'Win', score: '', round: '',
  })
  const [stats, setStats] = useState(
    PLAYERS.map(p => ({ playerId: p.id, hero: '', kills: '', deaths: '', assists: '', damage: '', mvp: false }))
  )

  function updateStat(idx, field, value) {
    setStats(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { data: match, error } = await supabase.from('matches').insert({ ...form, team_id: 'ph5-001' }).select().single()
    if (error) { addToast({ message: 'Failed to save match.', type: 'danger' }); return }
    await supabase.from('match_player_stats').insert(stats.map(s => ({ ...s, match_id: match.id })))
    addToast({ message: 'Match result saved.', type: 'success' })
    setForm(f => ({ ...f, opponent: '', score: '', round: '' }))
  }

  return (
    <DashboardLayout title="Phantom Five" subtitle="Match Input">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Add match result</h2>
      <p className="text-xs text-slate-400 mb-4">Record a match result and individual player stats.</p>
      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Match details</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Tournament</label>
              <select className="form-input" value={form.tournament} onChange={e => setForm(f => ({ ...f, tournament: e.target.value }))}>
                <option>ML Weekly Cup #24</option><option>MDL Season 8</option><option>Other</option>
              </select></div>
            <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="form-label">Opponent</label><input className="form-input" placeholder="e.g. Red Titans" value={form.opponent} onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))} required /></div>
            <div><label className="form-label">Result</label>
              <select className="form-input" value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                <option>Win</option><option>Loss</option>
              </select></div>
            <div><label className="form-label">Score</label><input className="form-input" placeholder="e.g. 2–1" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} /></div>
            <div><label className="form-label">Round / Stage</label><input className="form-input" placeholder="e.g. Quarterfinal" value={form.round} onChange={e => setForm(f => ({ ...f, round: e.target.value }))} /></div>
          </div>
        </div>
        <div className="card mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Player stats</p>
          <table className="w-full">
            <thead><tr>{['Player', 'Hero', 'K', 'D', 'A', 'Damage', 'MVP'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {PLAYERS.map((p, idx) => (
                <tr key={p.id}>
                  <td className="table-td text-xs">{p.name} <span className="text-slate-400">({p.lane})</span></td>
                  <td className="table-td"><input className="form-input py-1 w-24" placeholder="Hero" value={stats[idx].hero} onChange={e => updateStat(idx, 'hero', e.target.value)} /></td>
                  <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx].kills} onChange={e => updateStat(idx, 'kills', e.target.value)} /></td>
                  <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx].deaths} onChange={e => updateStat(idx, 'deaths', e.target.value)} /></td>
                  <td className="table-td"><input className="form-input py-1 w-14 text-center" placeholder="0" value={stats[idx].assists} onChange={e => updateStat(idx, 'assists', e.target.value)} /></td>
                  <td className="table-td"><input className="form-input py-1 w-24" placeholder="0" value={stats[idx].damage} onChange={e => updateStat(idx, 'damage', e.target.value)} /></td>
                  <td className="table-td"><input type="checkbox" checked={stats[idx].mvp} onChange={e => updateStat(idx, 'mvp', e.target.checked)} className="cursor-pointer" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">Save match</button>
          <button type="button" className="btn">Cancel</button>
        </div>
      </form>
    </DashboardLayout>
  )
}
