import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { UserPlus, Search } from 'lucide-react'

const LANES = ['Gold Lane','Exp Lane','Mid','Jungle','Roam']

export default function RosterPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [editTarget, setEdit]   = useState(null)
  const [editForm, setForm]     = useState({})
  const [addOpen, setAddOpen]   = useState(false)
  const [addForm, setAddForm]   = useState({ name:'', ign:'', lane:'', email:'', password:'' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: p } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!p?.team_id) { setLoading(false); return }
      const { data } = await supabase.from('users').select('id,name,ign,lane,is_active,role').eq('team_id', p.team_id).neq('role','super_admin').order('name')
      setPlayers(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  function openEdit(p) { setEdit(p); setForm({ name:p.name||'', ign:p.ign||'', lane:p.lane||'' }) }

  async function handleSave() {
    const { error } = await supabase.from('users').update({ name:editForm.name, ign:editForm.ign, lane:editForm.lane }).eq('id', editTarget.id)
    if (error) { addToast({ message:'Gagal update.', type:'danger' }); return }
    setPlayers(prev => prev.map(p => p.id===editTarget.id ? {...p,...editForm} : p))
    addToast({ message:'Pemain diperbarui.', type:'success' })
    setEdit(null)
  }

  async function handleDeactivate(p) {
    const next = !p.is_active
    const { error } = await supabase.from('users').update({ is_active: next }).eq('id', p.id)
    if (!error) {
      setPlayers(prev => prev.map(x => x.id===p.id ? {...x,is_active:next} : x))
      addToast({ message:`${p.name} ${next?'diaktifkan':'dinonaktifkan'}.`, type:'success' })
    }
  }

  const ROLE_BADGE = { team_manager:'badge-ocean', staff:'badge-amber', player:'badge-slate' }
  const ROLE_LABEL = { team_manager:'Manager', staff:'Staff', player:'Player' }
  const filtered = players.filter(p => !search || (p.name+p.ign+p.lane).toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout title="Roster">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Roster</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua anggota tim kamu.</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:240 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }} />
            <input className="form-input" style={{ paddingLeft:30 }} placeholder="Cari nama, IGN, lane..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-dim)' }}>{filtered.length} anggota</span>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Tidak ada anggota ditemukan.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%' }}>
              <thead><tr>{['Nama','IGN','Lane','Role','Status','Aksi'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{p.name||'—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>{p.ign||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{p.lane||'—'}</td>
                    <td className="table-td"><span className={`badge ${ROLE_BADGE[p.role]||'badge-slate'}`}>{ROLE_LABEL[p.role]||p.role}</span></td>
                    <td className="table-td"><span className={`badge ${p.is_active?'badge-green':'badge-slate'}`}>{p.is_active?'Aktif':'Nonaktif'}</span></td>
                    <td className="table-td">
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} onClick={()=>openEdit(p)}>Edit</button>
                        <button className={`btn ${p.is_active?'btn-danger':'btn-success'}`} style={{ fontSize:11, padding:'4px 8px' }} onClick={()=>handleDeactivate(p)}>
                          {p.is_active?'Nonaktif':'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editTarget} onClose={()=>setEdit(null)} title="Edit Anggota"
        footer={<><Button onClick={()=>setEdit(null)}>Batal</Button><Button variant="primary" onClick={handleSave} disabled={saving}>Simpan</Button></>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div><label className="form-label">Nama lengkap</label><input className="form-input" value={editForm.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
          <div><label className="form-label">IGN (In-Game Name)</label><input className="form-input" value={editForm.ign||''} onChange={e=>setForm(f=>({...f,ign:e.target.value}))} /></div>
          <div>
            <label className="form-label">Lane</label>
            <select className="form-input" value={editForm.lane||''} onChange={e=>setForm(f=>({...f,lane:e.target.value}))}>
              <option value="">— Pilih lane —</option>
              {LANES.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
