import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DeactivateModal from '@/components/super-admin/DeactivateModal'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

const INITIAL = [
  { id: 'ph5-001', name: 'Phantom Five', game: 'Mobile Legends', manager: 'Hendra K.', members: 7, status: 'active', created: '15 Mar 2025' },
]

export default function TeamsPage() {
  const [teams, setTeams]   = useState(INITIAL)
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  async function handleDeactivate() {
    setLoading(true)
    const { error } = await supabase.from('teams').update({ is_active: false }).eq('id', target.id)
    if (error) {
      addToast({ message: 'Failed to deactivate team.', type: 'danger' })
    } else {
      setTeams(prev => prev.map(t => t.id === target.id ? { ...t, status: 'inactive' } : t))
      addToast({ message: `${target.name} deactivated. All members are blocked from login.`, type: 'success' })
    }
    setLoading(false)
    setTarget(null)
  }

  async function handleActivate(team) {
    const { error } = await supabase.from('teams').update({ is_active: true }).eq('id', team.id)
    if (!error) {
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, status: 'active' } : t))
      addToast({ message: `${team.name} reactivated.`, type: 'success' })
    }
  }

  return (
    <DashboardLayout title="Teams">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Teams</h2>
      <p className="text-xs text-slate-400 mb-4">All teams registered in the system.</p>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <input className="form-input max-w-[200px]" placeholder="Search teams..." />
          <button className="btn btn-primary text-xs">+ New team</button>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Team', 'Game', 'Manager', 'Members', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="hover:bg-slate-50">
                <td className="table-td">
                  <p className="font-medium">{team.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{team.id}</p>
                </td>
                <td className="table-td">{team.game}</td>
                <td className="table-td">{team.manager}</td>
                <td className="table-td">{team.members}</td>
                <td className="table-td">
                  <span className={`badge ${team.status === 'active' ? 'badge-green' : 'badge-slate'}`}>{team.status}</span>
                </td>
                <td className="table-td text-slate-400">{team.created}</td>
                <td className="table-td">
                  {team.status === 'active'
                    ? <button className="btn btn-danger text-xs py-1" onClick={() => setTarget(team)}>Deactivate</button>
                    : <button className="btn btn-success text-xs py-1" onClick={() => handleActivate(team)}>Activate</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeactivateModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={handleDeactivate}
        teamName={target?.name}
        loading={loading}
      />
    </DashboardLayout>
  )
}
