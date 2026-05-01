// ProfilePage.jsx — v5
// Tambah: game_user_id + zone_id field (format MLBB)

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { User, Save, Shield, CheckCircle, Crown } from 'lucide-react'

const LANE_OPTIONS = ['Jungle','Gold Lane','Exp Lane','Mid','Roam']

export default function ProfilePage() {
  const { user, role } = useAuth()
  const { addToast }   = useToast()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [myTeams, setMyTeams] = useState([]) // Tim kompetitif yang diikuti

  const [form, setForm] = useState({
    name:'', ign:'', nickname:'', game_user_id:'', zone_id:'',
    phone:'', bio:'', lane:'',
  })

  useEffect(() => {
    async function load() {
      if (!user) return
      const [{ data }, { data:membership }] = await Promise.all([
        supabase.from('users').select('*').eq('id',user.id).single(),
        supabase.from('team_lineup_members')
          .select('is_captain, role_in_team, team_lineups(id,name,tag,status)')
          .eq('player_id', user.id),
      ])
      if (data) {
        setForm({
          name:         data.name         || '',
          ign:          data.ign          || '',
          nickname:     data.nickname     || data.ign || '',
          game_user_id: data.game_user_id || '',
          zone_id:      data.zone_id      || '',
          phone:        data.phone        || '',
          bio:          data.bio          || '',
          lane:         data.lane         || '',
        })
      }
      setMyTeams(membership||[])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { addToast({ message:'Nama tidak boleh kosong.', type:'danger' }); return }
    setSaving(true)

    // Rebuild IGN lengkap: "nickname | game_user_id (zone_id)"
    let fullIGN = form.nickname.trim() || form.ign.trim()
    if (form.game_user_id.trim()) {
      fullIGN = form.zone_id.trim()
        ? `${fullIGN} | ${form.game_user_id.trim()} (${form.zone_id.trim()})`
        : `${fullIGN} | ${form.game_user_id.trim()}`
    }

    const { error } = await supabase.from('users').update({
      name:         form.name.trim(),
      ign:          fullIGN || null,
      nickname:     form.nickname.trim() || null,
      game_user_id: form.game_user_id.trim() || null,
      zone_id:      form.zone_id.trim()      || null,
      phone:        form.phone.trim()        || null,
      bio:          form.bio.trim()          || null,
      lane:         form.lane               || null,
    }).eq('id', user.id)

    if (error) { addToast({ message:`Gagal: ${error.message}`, type:'danger' }) }
    else {
      addToast({ message:'Profil diperbarui!', type:'success' })
      setSaved(true); setTimeout(()=>setSaved(false), 3000)
    }
    setSaving(false)
  }

  // Preview IGN
  const previewIGN = (() => {
    let ign = form.nickname || form.ign || 'Nickname'
    if (form.game_user_id) ign += ` | ${form.game_user_id}`
    if (form.game_user_id && form.zone_id) ign += ` (${form.zone_id})`
    return ign
  })()

  const roleLabel = { super_admin:'Super Admin', team_manager:'Team Manager', staff:'Staff', player:'Player' }

  if (loading) return <DashboardLayout title="Profil Saya"><p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p></DashboardLayout>

  return (
    <DashboardLayout title="Profil Saya">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Pengaturan Profil</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Perbarui nickname, IGN, ID game, dan informasi profil kamu.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap:16, alignItems:'start' }}>
        <form onSubmit={handleSave}>
          <div className="card" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:14, paddingBottom:16, borderBottom:'1px solid var(--border-1)' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <User size={22} style={{ color:'var(--red)' }}/>
              </div>
              <div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
                  {form.nickname||form.ign||form.name||'User'}
                </p>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'IBM Plex Mono,monospace', marginTop:2 }}>{previewIGN}</p>
                <p style={{ fontSize:10, color:'var(--text-dim)' }}>{user?.email}</p>
              </div>
            </div>

            {/* Nama tampilan */}
            <div>
              <label className="form-label">Nama Tampilan *</label>
              <input className="form-input" placeholder="Nama di sistem" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>

            {/* Nickname + Game ID + Zone ID */}
            <div>
              <label className="form-label">Nickname / IGN & ID Game</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 80px', gap:8 }}>
                <div>
                  <input className="form-input" placeholder="Nickname in-game" maxLength={30}
                    value={form.nickname} onChange={e=>setForm(f=>({...f,nickname:e.target.value}))} />
                  <p style={{ fontSize:9, color:'var(--text-dim)', marginTop:3 }}>Nickname</p>
                </div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--text-dim)', pointerEvents:'none', marginTop:-10 }}>|</span>
                  <input className="form-input" style={{ paddingLeft:18, fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}
                    placeholder="12345678" maxLength={20}
                    value={form.game_user_id} onChange={e=>setForm(f=>({...f,game_user_id:e.target.value.replace(/\D/g,'')}))} />
                  <p style={{ fontSize:9, color:'var(--text-dim)', marginTop:3 }}>User ID</p>
                </div>
                <div style={{ position:'relative' }}>
                  <input className="form-input" style={{ paddingLeft:10, fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}
                    placeholder="1234" maxLength={10}
                    value={form.zone_id} onChange={e=>setForm(f=>({...f,zone_id:e.target.value.replace(/\D/g,'')}))} />
                  <p style={{ fontSize:9, color:'var(--text-dim)', marginTop:3 }}>( Zone ID )</p>
                </div>
              </div>
              {(form.nickname||form.game_user_id) && (
                <div style={{ marginTop:6, padding:'6px 10px', background:'var(--bg-elevated)', borderRadius:7, fontSize:11, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-muted)' }}>
                  Preview: <strong style={{ color:'var(--text-primary)' }}>{previewIGN}</strong>
                </div>
              )}
            </div>

            {(role==='player'||role==='staff') && (
              <div>
                <label className="form-label">Lane / Posisi</label>
                <select className="form-input" value={form.lane} onChange={e=>setForm(f=>({...f,lane:e.target.value}))}>
                  <option value="">Pilih posisi...</option>
                  {LANE_OPTIONS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Bio (opsional)</label>
              <textarea className="form-input" rows={3} placeholder="Ceritakan sedikit tentang dirimu..."
                value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} />
            </div>

            <div>
              <label className="form-label">Nomor HP (opsional)</label>
              <input className="form-input" type="tel" placeholder="+62 812 xxxx xxxx"
                value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center', paddingTop:4 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap:6 }}>
                <Save size={12}/>{saving?'Menyimpan...':'Simpan Perubahan'}
              </button>
              {saved && <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--green)' }}><CheckCircle size={12}/> Tersimpan!</span>}
            </div>
          </div>
        </form>

        {/* Sidebar info */}
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
                <span className={`badge ${role==='super_admin'?'badge-red':role==='team_manager'?'badge-cyan':role==='staff'?'badge-amber':'badge-green'}`}>
                  {roleLabel[role]||role}
                </span>
              </div>
            </div>
          </div>

          {/* Tim kompetitif yang diikuti */}
          {myTeams.length > 0 && (
            <div className="card">
              <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:12, fontFamily:'Syne,sans-serif' }}>Tim Kompetitif</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {myTeams.map((m, i) => {
                  const l = m.team_lineups
                  if (!l) return null
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {m.is_captain && <Crown size={12} fill="#f59e0b" style={{ color:'#f59e0b', flexShrink:0 }}/>}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>
                          {l.tag?`[${l.tag}] `:''}{l.name}
                        </p>
                        <p style={{ fontSize:10, color:'var(--text-dim)' }}>{m.role_in_team}{m.is_captain?' · Kapten':''}</p>
                      </div>
                      <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:l.status==='Active'?'rgba(34,197,94,0.15)':'var(--bg-elevated)', color:l.status==='Active'?'var(--green)':'var(--text-dim)' }}>{l.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="card" style={{ background:'rgba(225,29,72,0.04)', border:'1px solid rgba(225,29,72,0.1)' }}>
            <div style={{ display:'flex', gap:10 }}>
              <Shield size={14} style={{ color:'var(--red)', flexShrink:0, marginTop:1 }}/>
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