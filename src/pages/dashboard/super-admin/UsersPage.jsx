import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const ROLE_BADGE  = { super_admin: 'badge-red', team_manager: 'badge-blue', staff: 'badge-amber', player: 'badge-slate' }
const ROLE_LABELS = { super_admin: 'Super Admin', team_manager: 'Team Manager', staff: 'Staff', player: 'Player' }

const USERS = [
  { id: 'u1', name: 'Rafi A.',    email: 'rafi@phantom.gg',    role: 'super_admin',  team: '—',            status: 'active' },
  { id: 'u2', name: 'Hendra K.', email: 'hendra@phantom.gg',  role: 'team_manager', team: 'Phantom Five', status: 'active' },
  { id: 'u3', name: 'Budi W.',   email: 'budi@phantom.gg',    role: 'staff',        team: 'Phantom Five', status: 'active' },
  { id: 'u4', name: 'Reza P.',   email: 'reza@phantom.gg',    role: 'player',       team: 'Phantom Five', status: 'active' },
  { id: 'u5', name: 'Dito S.',   email: 'dito@phantom.gg',    role: 'player',       team: 'Phantom Five', status: 'active' },
  { id: 'u6', name: 'Fajar M.',  email: 'fajar@phantom.gg',   role: 'player',       team: 'Phantom Five', status: 'active' },
  { id: 'u7', name: 'Aldo F.',   email: 'aldo@phantom.gg',    role: 'player',       team: 'Phantom Five', status: 'active' },
  { id: 'u8', name: 'Bima R.',   email: 'bima@phantom.gg',    role: 'player',       team: 'Phantom Five', status: 'inactive' },
]

export function UsersPage() {
  const [resetTarget, setResetTarget] = useState(null)
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
          <thead>
            <tr>{['Name', 'Email', 'Role', 'Team', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {USERS.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="table-td font-medium">{u.name}</td>
                <td className="table-td font-mono text-xs text-slate-500">{u.email}</td>
                <td className="table-td"><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                <td className="table-td text-slate-500">{u.team}</td>
                <td className="table-td"><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-slate'}`}>{u.status}</span></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button className="btn text-xs py-1" onClick={() => setResetTarget(u)}>Reset pwd</button>
                    {u.role !== 'super_admin' && <button className="btn btn-danger text-xs py-1">Disable</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset password"
        size="sm"
        footer={<><Button onClick={() => setResetTarget(null)}>Cancel</Button><Button variant="primary" onClick={() => setResetTarget(null)}>Send reset link</Button></>}
      >
        <p>Send a password reset link to <strong className="text-slate-800">{resetTarget?.email}</strong>?</p>
        <p className="mt-2 text-xs text-slate-400">The user will receive an email with instructions to set a new password.</p>
      </Modal>
    </DashboardLayout>
  )
}
export default UsersPage
