import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

const ROLE_BADGE  = { super_admin:'badge-red', team_manager:'badge-blue', staff:'badge-amber', player:'badge-slate' }
const ROLE_LABELS = { super_admin:'Super Admin', team_manager:'Team Manager', staff:'Staff', player:'Player' }

export default function UsersPage() {
  const { addToast } = useToast()
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [resetTarget, setResetTarget] = useState(null)
  const [sending, setSending]       = useState(false)

  useEffect(() => {
    supabase.from('users').select('id,name,email,role,team_id,is_active,teams(name)').order('role').then(({ data }) => {
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  async function handleReset() {
    setSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetTarget.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) addToast({ message: 'Failed to send reset email.', type: 'danger' })
    else addToast({ message: `Reset link sent to ${resetTarget.email}.`, type: 'success' })
    setSending(false)
    setResetTarget(null)
  }

  async function handleToggle(u) {
    const { error } = await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    if (!error) setUsers(prev => prev.map(x => x.id===u.id ? {...x,is_active:!u.is_active} : x))
  }

  if (loading) return <DashboardLayout title="User Management"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

  return (
    <DashboardLayout title="User Management">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Users</h2>
      <p className="text-xs text-slate-400 mb-4">All user accounts in the system.</p>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <input className="form-input max-w-[200px]" placeholder="Search users..." />
          <button className="btn btn-primary text-xs">+ Invite user</button>
        </div>
        <table className="w-full">
          <thead><tr>{['Name','Email','Role','Team','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="table-td font-medium">{u.name}</td>
                <td className="table-td font-mono text-xs text-slate-500">{u.email}</td>
                <td className="table-td"><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                <td className="table-td text-slate-500">{u.teams?.name || '—'}</td>
                <td className="table-td"><span className={`badge ${u.is_active?'badge-green':'badge-slate'}`}>{u.is_active?'active':'inactive'}</span></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button className="btn text-xs py-1" onClick={()=>setResetTarget(u)}>Reset pwd</button>
                    {u.role !== 'super_admin' && (
                      <button className={`btn text-xs py-1 ${u.is_active?'btn-danger':''}`} onClick={()=>handleToggle(u)}>
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!resetTarget} onClose={()=>setResetTarget(null)} title="Reset password" size="sm"
        footer={<><Button onClick={()=>setResetTarget(null)}>Cancel</Button><Button variant="primary" onClick={handleReset} disabled={sending}>{sending?'Sending...':'Send reset link'}</Button></>}
      >
        <p>Send a password reset link to <strong className="text-slate-800">{resetTarget?.email}</strong>?</p>
        <p className="mt-2 text-xs text-slate-400">The user will receive an email with instructions to set a new password.</p>
      </Modal>
    </DashboardLayout>
  )
}
