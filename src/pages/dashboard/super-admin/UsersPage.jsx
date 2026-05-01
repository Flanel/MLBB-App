import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react'

const ROLE_BADGE  = {
  super_admin:  'badge-red',
  team_manager: 'badge-ocean',
  staff:        'badge-amber',
  player:       'badge-slate',
}
const ROLE_LABELS = {
  super_admin:  'Super Admin',
  team_manager: 'Team Manager',
  staff:        'Staff',
  player:       'Player',
}

const CHANGEABLE_ROLES = ['player', 'team_manager', 'staff']

const ASSIGNABLE_ROLES = [
  { value: 'player',       label: 'Player' },
  { value: 'staff',        label: 'Staff' },
  { value: 'team_manager', label: 'Team Manager' },
]

export default function UsersPage() {
  const { addToast }           = useToast()
  const { user: currentUser }  = useAuth()

  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [resetTarget, setResetTarget]   = useState(null)
  const [sending, setSending]           = useState(false)
  const [roleTarget, setRoleTarget]     = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [changingRole, setChangingRole] = useState(false)

  function fetchUsers() {
    setLoading(true)
    supabase
      .from('users')
      .select('id,name,email,role,team_id,is_active,teams(name)')
      .order('role')
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleReset() {
    setSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetTarget.email,
      { redirectTo: `${window.location.origin}/reset-password` }
    )
    if (error) addToast({ message: 'Gagal kirim email reset.', type: 'danger' })
    else       addToast({ message: `Link reset dikirim ke ${resetTarget.email}.`, type: 'success' })
    setSending(false)
    setResetTarget(null)
  }

  async function handleToggle(u) {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !u.is_active })
      .eq('id', u.id)
    if (!error) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
      addToast({ message: `${u.name} ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, type: 'success' })
    }
  }

  function openRoleModal(u) {
    setRoleTarget(u)
    setSelectedRole(u.role)
  }

  async function handleRoleChange() {
    if (!roleTarget || selectedRole === roleTarget.role) {
      setRoleTarget(null)
      return
    }
    setChangingRole(true)
    const { error } = await supabase
      .from('users')
      .update({ role: selectedRole })
      .eq('id', roleTarget.id)

    if (error) {
      addToast({ message: 'Gagal mengubah role.', type: 'danger' })
    } else {
      await supabase.from('audit_logs').insert({
        user_id: currentUser?.id,
        role:    'super_admin',
        action:  `Mengubah role ${roleTarget.name} dari ${roleTarget.role} menjadi ${selectedRole}`,
        target:  roleTarget.id,
      })
      setUsers(prev =>
        prev.map(x => x.id === roleTarget.id ? { ...x, role: selectedRole } : x)
      )
      addToast({
        message: `Role ${roleTarget.name} berhasil diubah menjadi ${ROLE_LABELS[selectedRole]}.`,
        type: 'success',
      })
    }
    setChangingRole(false)
    setRoleTarget(null)
  }

  const filtered = users.filter(u =>
    !search || (u.name + u.email + u.role).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout title="User Management">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>Users</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Semua akun pengguna dalam sistem.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 30 }}
              placeholder="Cari nama / email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn" style={{ padding: '6px 10px' }} onClick={fetchUsers}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>{filtered.length} user</span>
        </div>

        <div className="table-scroll-container">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 12 }}>Memuat...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 12 }}>Tidak ada user ditemukan.</p>
          ) : (
            <table style={{ width: '100%', minWidth: 640 }}>
              <thead>
                <tr>
                  {['Nama', 'Email', 'Role', 'Tim', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="table-td" style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {u.name || '—'}
                    </td>
                    <td className="table-td" style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </td>
                    <td className="table-td">
                      <span className={`badge ${ROLE_BADGE[u.role] || 'badge-slate'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="table-td" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {u.teams?.name || '—'}
                    </td>
                    <td className="table-td">
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-slate'}`}>
                        {u.is_active ? 'aktif' : 'nonaktif'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {CHANGEABLE_ROLES.includes(u.role) && (
                          <button
                            className="btn btn-cyan"
                            style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => openRoleModal(u)}
                            title="Ubah Role"
                          >
                            <ArrowUpDown size={11} /> Role
                          </button>
                        )}
                        <button
                          className="btn"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => setResetTarget(u)}
                        >
                          Reset Pwd
                        </button>
                        {u.role !== 'super_admin' && (
                          <button
                            className={`btn ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => handleToggle(u)}
                          >
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        size="sm"
        footer={
          <>
            <Button onClick={() => setResetTarget(null)}>Batal</Button>
            <Button variant="primary" onClick={handleReset} disabled={sending}>
              {sending ? 'Mengirim...' : 'Kirim Link Reset'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Kirim link reset password ke{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{resetTarget?.email}</strong>?
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          User akan menerima email dengan instruksi untuk mengatur password baru.
        </p>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Ubah Role User"
        size="sm"
        footer={
          <>
            <Button onClick={() => setRoleTarget(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={handleRoleChange}
              disabled={changingRole || selectedRole === roleTarget?.role}
            >
              {changingRole ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </>
        }
      >
        {roleTarget && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--canvas-alt)', borderRadius: 'var(--radius-md)', border: 'var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{roleTarget.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{roleTarget.email}</p>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Tim: <span style={{ color: 'var(--text-muted)' }}>{roleTarget.teams?.name || '—'}</span>
              </p>
            </div>

            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 10 }}>
              Role saat ini:{' '}
              <span className={`badge ${ROLE_BADGE[roleTarget.role] || 'badge-slate'}`}>
                {ROLE_LABELS[roleTarget.role]}
              </span>
            </p>

            <label className="form-label">Ubah ke Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {ASSIGNABLE_ROLES.map(r => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: selectedRole === r.value ? '1.5px solid var(--brand)' : 'var(--border)',
                    background: selectedRole === r.value ? 'var(--brand-subtle)' : 'var(--canvas)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="radio"
                    name="roleSelect"
                    value={r.value}
                    checked={selectedRole === r.value}
                    onChange={() => setSelectedRole(r.value)}
                    style={{ accentColor: 'var(--brand)', width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{r.label}</span>
                  {r.value === roleTarget.role && (
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>saat ini</span>
                  )}
                  <span className={`badge ${ROLE_BADGE[r.value] || 'badge-slate'}`}>{r.label}</span>
                </label>
              ))}
            </div>

            {selectedRole !== roleTarget.role && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(225,29,72,0.05)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 12, color: 'var(--brand)', lineHeight: 1.5 }}>
                  ⚠️ Mengubah role akan mempengaruhi akses dan menu yang tersedia untuk user ini.
                </p>
              </div>
            )}
          </>
        )}
      </Modal>
    </DashboardLayout>
  )
}
