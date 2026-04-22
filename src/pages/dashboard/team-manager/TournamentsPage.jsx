import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Plus, RefreshCw } from 'lucide-react'

const STATUS_BADGE = { Ongoing:'badge-ocean', Completed:'badge-green', Cancelled:'badge-slate' }

export default function TournamentsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [tournaments, setTournaments] = useState([])
  const [teamId, setTeamId]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [createOpen, setCreateOpen]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm] = useState({ name:'', platform:'', format:'', date_label:'', placement:'', total_teams:'', status:'Ongoing', notes:'' })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)
      const { data } = await supabase.from('tournaments').select('*').eq('team_id', profile.team_id).order('created_at', { ascending: false })
      setTournaments(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleCreate() {
    if (!form.name.trim()) { addToast({ message:'Isi nama tournament.', type:'danger' }); return }
    setSaving(true)
    const { data, error } = await supabase.from('tournaments').insert({
      team_id: teamId, name: form.name.trim(), platform: form.platform || null,
      format: form.format || null, date_label: form.date_label || null,
      placement: form.placement || null, total_teams: parseInt(form.total_teams) || null,
      status: form.status, notes: form.notes || null,
    }).select().single()
    if (error) { addToast({ message: `Gagal: ${error.message}`, type:'danger' }); setSaving(false); return }
    setTournaments(prev => [data, ...prev])
    await supabase.from('audit_logs').insert({ user_id: user.id, action:'Tambah tournament', target: form.name })
    addToast({ message: `${form.name} ditambahkan.`, type:'success' })
    setCreateOpen(false)
    setForm({ name:'', platform:'', format:'', date_label:'', placement:'', total_teams:'', status:'Ongoing', notes:'' })
    setSaving(false)
  }

  async function updateStatus(t, status) {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', t.id)
    if (!error) setTournaments(prev => prev.map(x => x.id===t.id ? {...x,status} : x))
  }

  return (
    <DashboardLayout title="Tournaments">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Tournament</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Catat dan kelola partisipasi tournament tim.</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => setCreateOpen(true)}>
          <Plus size={13}/>Tambah Tournament
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
        ) : tournaments.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Belum ada tournament. Tambah tournament pertama!</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%' }}>
              <thead><tr>{['Tournament','Platform','Format','Tanggal','Tim','Placement','Status','Aksi'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t.id}>
                    <td className="table-td" style={{ fontWeight:500, color:'var(--text-primary)' }}>{t.name}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{t.platform||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-muted)' }}>{t.format||'—'}</td>
                    <td className="table-td" style={{ color:'var(--text-dim)', fontSize:12 }}>{t.date_label||'—'}</td>
                    <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{t.total_teams||'—'}</td>
                    <td className="table-td">{t.placement ? <span className="badge badge-green">{t.placement}</span> : <span style={{ color:'var(--text-dim)' }}>—</span>}</td>
                    <td className="table-td"><span className={`badge ${STATUS_BADGE[t.status]||'badge-slate'}`}>{t.status}</span></td>
                    <td className="table-td">
                      {t.status === 'Ongoing' ? (
                        <button className="btn btn-success" style={{ fontSize:11, padding:'4px 8px' }} onClick={() => updateStatus(t, 'Completed')}>Selesai</button>
                      ) : (
                        <button className="btn" style={{ fontSize:11, padding:'4px 8px' }} onClick={() => updateStatus(t, 'Ongoing')}>Aktifkan</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah Tournament" size="md"
        footer={<><Button onClick={() => setCreateOpen(false)}>Batal</Button><Button variant="primary" onClick={handleCreate} disabled={saving}>{saving?'Menyimpan...':'Simpan'}</Button></>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div><label className="form-label">Nama Tournament *</label><input className="form-input" placeholder="e.g. MPL Indonesia S16" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="form-label">Platform</label><input className="form-input" placeholder="e.g. Challonge, Official" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} /></div>
            <div><label className="form-label">Format</label><input className="form-input" placeholder="e.g. Double Elimination" value={form.format} onChange={e=>setForm(f=>({...f,format:e.target.value}))} /></div>
            <div><label className="form-label">Tanggal / Periode</label><input className="form-input" placeholder="e.g. Apr–Jun 2025" value={form.date_label} onChange={e=>setForm(f=>({...f,date_label:e.target.value}))} /></div>
            <div><label className="form-label">Total Tim</label><input type="number" className="form-input" placeholder="e.g. 16" value={form.total_teams} onChange={e=>setForm(f=>({...f,total_teams:e.target.value}))} /></div>
            <div><label className="form-label">Placement Kami</label><input className="form-input" placeholder="e.g. Top 8, 2nd Place" value={form.placement} onChange={e=>setForm(f=>({...f,placement:e.target.value}))} /></div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option>Ongoing</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Catatan</label><textarea className="form-input" rows={2} placeholder="Informasi tambahan..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
