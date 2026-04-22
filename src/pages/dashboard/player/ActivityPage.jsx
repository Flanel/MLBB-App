import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'

const TYPES = ['Team Scrim', 'Solo Rank', 'Review / VOD', 'Physical Training', 'Other']
const DOT = {
  'Team Scrim':        'var(--brand)',
  'Solo Rank':         'var(--green)',
  'Review / VOD':      'var(--amber)',
  'Physical Training': 'var(--red)',
  'Other':             'var(--text-muted)',
}

export default function ActivityPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [form, setForm]     = useState({ type:'Team Scrim', duration:'', note:'' })
  const [feed, setFeed]     = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('player_activities').select('*').eq('user_id', user.id).order('logged_at', { ascending:false }).limit(15)
      .then(({ data }) => setFeed(data || []))
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.duration) return
    setSaving(true)
    const { data, error } = await supabase.from('player_activities').insert({
      user_id: user.id, activity_type: form.type,
      duration_minutes: parseInt(form.duration), notes: form.note || null,
    }).select().single()
    if (error) addToast({ message:'Gagal menyimpan.', type:'danger' })
    else { setFeed(prev => [data, ...prev]); addToast({ message:'Aktivitas dicatat.', type:'success' }); setForm(f => ({...f, duration:'', note:''})) }
    setSaving(false)
  }

  const totalMin = feed.reduce((s, x) => s + (x.duration_minutes || 0), 0)
  const hrs = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  return (
    <DashboardLayout title="Activity Log">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Activity Log</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Catat latihan pribadi dan aktivitas harianmu.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Log form */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Catat Hari Ini</p>
          <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="form-label">Tipe Aktivitas</label>
              <select className="form-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Durasi (menit)</label>
              <input type="number" min="1" className="form-input" placeholder="e.g. 90" value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} required />
            </div>
            <div>
              <label className="form-label">Catatan (opsional)</label>
              <textarea className="form-input" rows={3} placeholder="Apa yang kamu kerjakan?" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent:'center' }} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Aktivitas'}
            </button>
          </form>

          {/* Total hours */}
          {feed.length > 0 && (
            <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border-2)' }}>
              <p style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Tercatat</p>
              <p style={{ fontSize:20, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--red)', marginTop:4 }}>{hrs}j {mins}m</p>
              <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>dari {feed.length} sesi</p>
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="card">
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:14, fontFamily:'Syne,sans-serif' }}>Riwayat Aktivitas</p>
          {feed.length === 0 ? (
            <p style={{ fontSize:12, color:'var(--text-dim)', textAlign:'center', padding:'24px 0' }}>Belum ada aktivitas dicatat.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {feed.map(item => (
                <div key={item.id} style={{ display:'flex', gap:12 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background: DOT[item.activity_type] || 'var(--text-muted)', marginTop:5, flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{item.activity_type}</span>
                      <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>{item.duration_minutes} mnt</span>
                    </div>
                    {item.notes && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, lineHeight:1.4 }}>{item.notes}</p>}
                    <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:3 }}>{format(new Date(item.logged_at), 'd MMM, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
