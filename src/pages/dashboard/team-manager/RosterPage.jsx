import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

const LANES = ['Gold Lane','Exp Lane','Mid','Jungle','Roam']

export default function RosterPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      const { data } = await supabase.from('users').select('id,name,ign,lane,is_active').eq('team_id', profile.team_id).eq('role','player').order('name')
      setPlayers(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  function openEdit(p) { setEditTarget(p); setEditForm({ name: p.name, ign: p.ign||'', lane: p.lane||'' }) }

  async function handleSave() {
    const { error } = await supabase.from('users').update({ name: editForm.name, ign: editForm.ign, lane: editForm.lane }).eq('id', editTarget.id)
    if (error) { addToast({ message: 'Update failed.', type: 'danger' }); return }
    setPlayers(prev => prev.map(p => p.id===editTarget.id ? {...p,...editForm} : p))
    addToast({ message: 'Player updated.', type: 'success' })
    setEditTarget(null)
  }

  async function handleDeactivate(p) {
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', p.id)
    if (!error) {
      setPlayers(prev => prev.map(x => x.id===p.id ? {...x,is_active:false} : x))
      addToast({ message: `${p.name} deactivated.`, type: 'success' })
    }
  }

  if (loading) return <DashboardLayout title="Roster"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

  return (
    <DashboardLayout title="Roster">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Roster</h2>
      <p className="text-xs text-slate-400 mb-4">Active players in your team.</p>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <input className="form-input max-w-[200px]" placeholder="Search players..." />
          <button className="btn btn-primary text-xs">+ Add player</button>
        </div>
        {players.length === 0
          ? <p className="text-xs text-slate-400 py-6 text-center">No players found.</p>
          : (
            <table className="w-full">
              <thead><tr>{['Player','IGN','Lane','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td font-mono text-xs">{p.ign||'—'}</td>
                    <td className="table-td">{p.lane||'—'}</td>
                    <td className="table-td"><span className={`badge ${p.is_active?'badge-green':'badge-slate'}`}>{p.is_active?'active':'inactive'}</span></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="btn text-xs py-1" onClick={()=>openEdit(p)}>Edit</button>
                        {p.is_active && <button className="btn btn-danger text-xs py-1" onClick={()=>handleDeactivate(p)}>Deactivate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
      <Modal open={!!editTarget} onClose={()=>setEditTarget(null)} title="Edit player"
        footer={<><Button onClick={()=>setEditTarget(null)}>Cancel</Button><Button variant="primary" onClick={handleSave}>Save changes</Button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Full name</label><input className="form-input" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></div>
          <div><label className="form-label">IGN</label><input className="form-input" value={editForm.ign||''} onChange={e=>setEditForm(f=>({...f,ign:e.target.value}))} /></div>
          <div>
            <label className="form-label">Lane</label>
            <select className="form-input" value={editForm.lane||''} onChange={e=>setEditForm(f=>({...f,lane:e.target.value}))}>
              <option value="">— Select lane —</option>
              {LANES.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
