// ProfilePage.jsx — Profil untuk semua role
import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { User, Save, Shield, CheckCircle } from 'lucide-react'

const LANE_OPTIONS = ['Jungle', 'Gold', 'Exp', 'Mid', 'Roam', 'Support', 'Analyst', 'Coach', 'Manager', 'Lainnya']

export default function ProfilePage() {
  const { user, role } = useAuth()
  const { addToast }   = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name:'', ign:'', nickname:'', phone:'', bio:'', lane:'' })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          name:     data.name     || '',
          ign:      data.ign      || '',
          nickname: data.nickname || data.ign || '',
          phone:    data.phone    || '',
          bio:      data.bio      || '',
          lane:     data.lane     || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { addToast({ message: 'Nama tidak boleh kosong.', type: 'danger' }); return }
    setSaving(true)
    const { error } = await supabase.from('users').update({
      name:     form.name.trim(),
      ign:      form.ign.trim()      || null,
      nickname: form.nickname.trim() || form.ign.trim() || form.name.trim(),
      phone:    form.phone.trim()    || null,
      bio:      form.bio.trim()      || null,
      lane:     form.lane            || null,
    }).eq('id', user.id)

    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }) }
    else {
      addToast({ message: 'Profil diperbarui!', type: 'success' })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const roleLabel = { super_admin:'Super Admin', team_manager:'Team Manager', staff:'Staff', player:'Player' }

  if (loading) return <DashboardLayout title="Profil Saya"><p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p></DashboardLayout>

  return (
    <DashboardLayout title="Profil Saya">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Pengaturan Profil</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Perbarui nickname, IGN, dan informasi profil kamu.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>
        <form onSubmit={handleSave}>
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, paddingBottom:16, borderBottom:'1px solid var(--border-1)' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <User size={22} style={{ color:'var(--red)' }} />
              </div>
              <div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{form.nickname || form.ign || form.name || 'User'}</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{user?.email}</p>
              </div>
            </div>

            <div>
              <label className="form-label">Nama Tampilan *</label>
              <input className="form-input" placeholder="Nama yang ditampilkan di sistem" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required />
              <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>Muncul di roster, statistik, dan laporan.</p>
            </div>

            <div>
              <label className="form-label">Nickname / IGN</label>
              <input className="form-input" placeholder="In-game name kamu" value={form.ign} onChange={e => setForm(f => ({...f, ign:e.target.value}))} />
              <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>Nama karakter di game.</p>
            </div>

            <div>
              <label className="form-label">Alias / Panggilan</label>
              <input className="form-input" placeholder="Nama alias lain (opsional)" value={form.nickname} onChange={e => setForm(f => ({...f, nickname:e.target.value}))} />
            </div>

            {(role === 'player' || role === 'staff') && (
              <div>
                <label className="form-label">Lane / Posisi</label>
                <select className="form-input" value={form.lane} onChange={e => setForm(f => ({...f, lane:e.target.value}))}>
                  <option value="">Pilih posisi...</option>
                  {LANE_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Bio (opsional)</label>
              <textarea className="form-input" rows={3} placeholder="Ceritakan sedikit tentang dirimu..." value={form.bio} onChange={e => setForm(f => ({...f, bio:e.target.value}))} />
            </div>

            <div>
              <label className="form-label">Nomor HP (opsional)</label>
              <input className="form-input" type="tel" placeholder="+62 812 xxxx xxxx" value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))} />
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center', paddingTop:4 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap:6 }}>
                <Save size={12} />{saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              {saved && <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--green)' }}><CheckCircle size={12}/> Tersimpan!</span>}
            </div>
          </div>
        </form>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card">
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:12, fontFamily:'Syne,sans-serif' }}>Info Akun</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <p style={{ fontSize:10, color:'var(--text-dim)', marginBottom:2 }}>Email</p>
                <p style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>{user?.email}</p>
                <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:2 }}>Tidak dapat diubah</p>
              </div>
              <div>
                <p style={{ fontSize:10, color:'var(--text-dim)', marginBottom:4 }}>Role</p>
                <span className={`badge ${role === 'super_admin' ? 'badge-red' : role === 'team_manager' ? 'badge-cyan' : role === 'staff' ? 'badge-amber' : 'badge-green'}`}>{roleLabel[role] || role}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ background:'rgba(225,29,72,0.04)', border:'1px solid rgba(225,29,72,0.1)' }}>
            <div style={{ display:'flex', gap:10 }}>
              <Shield size={14} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }} />
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Keamanan Akun</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>Email dan password hanya bisa diubah oleh administrator.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
