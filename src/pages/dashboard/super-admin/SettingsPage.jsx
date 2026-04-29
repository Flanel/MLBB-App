import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { Shield, Globe, Database, Bell } from 'lucide-react'

function SettingSection({ icon: Icon, title, children }) {
  return (
    <div className="card" style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} style={{ color:'var(--red)' }} />
        </div>
        <p style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { addToast } = useToast()
  const [appName, setAppName]   = useState('Noctis X King')
  const [tagline, setTagline]   = useState('Esports Team Management System')
  const [saving, setSaving]     = useState(false)
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirm] = useState('')

  async function saveAppInfo() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    addToast({ message: 'Pengaturan aplikasi disimpan.', type: 'success' })
  }

  async function changePassword() {
    if (!newPw || newPw !== confirmPw) { addToast({ message: 'Password tidak cocok.', type: 'danger' }); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) addToast({ message: error.message, type: 'danger' })
    else { addToast({ message: 'Password berhasil diubah.', type: 'success' }); setNewPw(''); setConfirm('') }
  }

  return (
    <DashboardLayout title="Settings">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Global Settings</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Konfigurasi seluruh aplikasi.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <SettingSection icon={Globe} title="Identitas Aplikasi">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label className="form-label">Nama Aplikasi</label><input className="form-input" value={appName} onChange={e=>setAppName(e.target.value)}/></div>
              <div><label className="form-label">Tagline</label><input className="form-input" value={tagline} onChange={e=>setTagline(e.target.value)}/></div>
              <button className="btn btn-primary" style={{ alignSelf:'flex-start' }} onClick={saveAppInfo} disabled={saving}>{saving?'Menyimpan...':'Simpan'}</button>
            </div>
          </SettingSection>

          <SettingSection icon={Bell} title="Notifikasi Sistem">
            {[['Laporan aktivitas mingguan','Kirim ringkasan ke Super Admin'],['Alert team nonaktif','Notif saat ada team di-deactivate']].map(([label, sub]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div><p style={{ fontSize:13, color:'var(--text-primary)' }}>{label}</p><p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{sub}</p></div>
                <label style={{ position:'relative', display:'inline-block', width:36, height:20, cursor:'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ opacity:0, width:0, height:0 }}/>
                  <span style={{ position:'absolute', inset:0, background:'var(--brand)', borderRadius:10, transition:'0.2s' }}/>
                  <span style={{ position:'absolute', top:2, left:2, width:16, height:16, background:'white', borderRadius:'50%', transition:'0.2s' }}/>
                </label>
              </div>
            ))}
          </SettingSection>
        </div>

        <div>
          <SettingSection icon={Shield} title="Keamanan Super Admin">
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label className="form-label">Password Baru</label><input type="password" className="form-input" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 8 karakter"/></div>
              <div><label className="form-label">Konfirmasi Password</label><input type="password" className="form-input" value={confirmPw} onChange={e=>setConfirm(e.target.value)} placeholder="Ulangi password"/></div>
              <button className="btn btn-danger" style={{ alignSelf:'flex-start' }} onClick={changePassword}>Ganti Password</button>
            </div>
          </SettingSection>

          <SettingSection icon={Database} title="Info Database">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[['Platform','Supabase (PostgreSQL)'],['Region','ap-southeast-1 (Singapore)'],['Auth','Supabase Auth (email/password)'],['Storage','Supabase Storage'],['RLS','Aktif — Row Level Security']].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border-1)', paddingBottom:8 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontSize:12, color:'var(--text-primary)', fontFamily:'IBM Plex Mono,monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </SettingSection>
        </div>
      </div>
    </DashboardLayout>
  )
}
