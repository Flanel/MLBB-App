import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { RefreshCw, Search } from 'lucide-react'

const ROLE_BADGE  = { super_admin:'badge-red', team_manager:'badge-ocean', staff:'badge-amber', player:'badge-slate' }
const ROLE_LABELS = { super_admin:'Super Admin', team_manager:'Team Manager', staff:'Staff', player:'Player' }

export default function UsersPage() {
  const { addToast } = useToast()
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [resetTarget, setResetTarget] = useState(null)
  const [sending, setSending]         = useState(false)

  function fetchUsers() {
    setLoading(true)
    supabase.from('users').select('id,name,email,role,team_id,is_active,teams(name)').order('role')
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleReset() {
    setSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetTarget.email, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) addToast({ message: 'Gagal kirim email reset.', type: 'danger' })
    else addToast({ message: `Link reset dikirim ke ${resetTarget.email}.`, type: 'success' })
    setSending(false)
    setResetTarget(null)
  }

  async function handleToggle(u) {
    const { error } = await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    if (!error) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
      addToast({ message: `${u.name} ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`, type: 'success' })
    }
  }

  const filtered = users.filter(u => !search || (u.name+u.email+u.role).toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout title="User Management">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Users</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua akun pengguna dalam sistem.</p>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:260 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }} />
            <input className="form-input" style={{ paddingLeft:30 }} placeholder="Cari nama / email..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="btn" style={{ padding:'6px 10px' }} onClick={fetchUsers}><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-dim)' }}>{filtered.length} user</span>
        </div>

        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
          ) : (
            <table style={{ width:'100%' }}>
              <thead><tr>{['Nama','Email','Role','Tim','Status','Aksi'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{u.name || '—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'var(--text-muted)' }}>{u.email}</td>
                    <td className="table-td"><span className={`badge ${ROLE_BADGE[u.role]||'badge-slate'}`}>{ROLE_LABELS[u.role]||u.role}</span></td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{u.teams?.name||'—'}</td>
                    <td className="table-td"><span className={`badge ${u.is_active?'badge-green':'badge-slate'}`}>{u.is_active?'aktif':'nonaktif'}</span></td>
                    <td className="table-td">
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} onClick={()=>setResetTarget(u)}>Reset Pwd</button>
                        {u.role !== 'super_admin' && (
                          <button className={`btn ${u.is_active?'btn-danger':'btn-success'}`} style={{ fontSize:11, padding:'4px 8px' }} onClick={()=>handleToggle(u)}>
                            {u.is_active?'Disable':'Enable'}
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

      <Modal open={!!resetTarget} onClose={()=>setResetTarget(null)} title="Reset Password" size="sm"
        footer={<><Button onClick={()=>setResetTarget(null)}>Batal</Button><Button variant="primary" onClick={handleReset} disabled={sending}>{sending?'Mengirim...':'Kirim Link Reset'}</Button></>}
      >
        <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Kirim link reset password ke <strong style={{ color:'var(--text-primary)' }}>{resetTarget?.email}</strong>?</p>
        <p style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>User akan menerima email dengan instruksi untuk mengatur password baru.</p>
      </Modal>
    </DashboardLayout>
  )
}
