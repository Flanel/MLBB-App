import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DeactivateModal from '@/components/super-admin/DeactivateModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

export default function TeamsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget]   = useState(null)
  const [deacting, setDeacting] = useState(false)

  useEffect(() => {
    supabase.from('teams').select('*').order('created_at').then(({ data }) => {
      setTeams(data || [])
      setLoading(false)
    })
  }, [])

  async function handleDeactivate() {
    setDeacting(true)
    const { error } = await supabase.from('teams').update({ is_active: false }).eq('id', target.id)
    if (error) {
      addToast({ message: 'Failed to deactivate team.', type: 'danger' })
    } else {
      setTeams(prev => prev.map(t => t.id===target.id ? {...t,is_active:false} : t))
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'Deactivated team', target: target.name })
      addToast({ message: `${target.name} deactivated. All members are blocked from login.`, type: 'success' })
    }
    setDeacting(false)
    setTarget(null)
  }

  async function handleActivate(team) {
    const { error } = await supabase.from('teams').update({ is_active: true }).eq('id', team.id)
    if (!error) {
      setTeams(prev => prev.map(t => t.id===team.id ? {...t,is_active:true} : t))
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'Activated team', target: team.name })
      addToast({ message: `${team.name} reactivated.`, type: 'success' })
    }
  }

  if (loading) return <DashboardLayout title="Teams"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

  return (
    <DashboardLayout title="Teams">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Teams</h2>
      <p className="text-xs text-slate-400 mb-4">All teams registered in the system.</p>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <input className="form-input max-w-[200px]" placeholder="Search teams..." />
          <button className="btn btn-primary text-xs">+ New team</button>
        </div>
        {teams.length === 0
          ? <p className="text-xs text-slate-400 py-6 text-center">No teams yet.</p>
          : (
            <table className="w-full">
              <thead><tr>{['Team','Game','Status','Created','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="table-td">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{team.id}</p>
                    </td>
                    <td className="table-td">{team.game}</td>
                    <td className="table-td"><span className={`badge ${team.is_active?'badge-green':'badge-slate'}`}>{team.is_active?'active':'inactive'}</span></td>
                    <td className="table-td text-slate-400">{new Date(team.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="table-td">
                      {team.is_active
                        ? <button className="btn btn-danger text-xs py-1" onClick={()=>setTarget(team)}>Deactivate</button>
                        : <button className="btn btn-success text-xs py-1" onClick={()=>handleActivate(team)}>Activate</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
      <DeactivateModal open={!!target} onClose={()=>setTarget(null)} onConfirm={handleDeactivate} teamName={target?.name} loading={deacting} />
    </DashboardLayout>
  )
}
