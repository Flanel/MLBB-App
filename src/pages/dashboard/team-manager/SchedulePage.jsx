import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus, Calendar, CheckCircle, XCircle, HelpCircle, Trash2 } from 'lucide-react'

const SESSION_TYPES = ['Latihan Tim', 'Scrim', 'Tournament', 'Review/VOD', 'Physical Training', 'Meeting']

const AVL_CONFIG = {
  'yes':   { label:'Bisa',       color:'var(--green)', bg:'var(--green-bg)', icon: CheckCircle },
  'no':    { label:'Tidak Bisa', color:'var(--red)',   bg:'var(--red-bg)',   icon: XCircle },
  'maybe': { label:'Mungkin',    color:'var(--amber)', bg:'var(--amber-bg)', icon: HelpCircle },
}

export default function SchedulePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [sessions, setSessions]     = useState([])
  const [players, setPlayers]       = useState([])
  const [teamId, setTeamId]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'Latihan Tim', date: '', start_time: '19:00', end_time: '21:00',
    location: '', notes: '', is_mandatory: true
  })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)

      const [{ data: sessData }, { data: playerData }] = await Promise.all([
        supabase.from('schedules').select('*, schedule_availability(*, users(name))').eq('team_id', profile.team_id).order('date').order('start_time'),
        supabase.from('users').select('id, name, lane').eq('team_id', profile.team_id).in('role', ['player', 'staff']).eq('is_active', true),
      ])
      setSessions(sessData || [])
      setPlayers(playerData || [])
      setLoading(false)
    }
    load()
  }, [user])

  async function handleCreate() {
    if (!form.title.trim() || !form.date) { addToast({ message: 'Isi judul dan tanggal.', type: 'danger' }); return }
    setSaving(true)
    const { data, error } = await supabase.from('schedules').insert({
      team_id: teamId, title: form.title.trim(), session_type: form.type,
      date: form.date, start_time: form.start_time, end_time: form.end_time,
      location: form.location || null, notes: form.notes || null,
      is_mandatory: form.is_mandatory, created_by: user.id,
    }).select().single()

    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }); setSaving(false); return }
    setSessions(prev => [...prev, { ...data, schedule_availability: [] }].sort((a,b)=>a.date>b.date?1:-1))
    await supabase.from('audit_logs').insert({ user_id: user.id, action:'Buat jadwal', target: form.title })
    addToast({ message: `Jadwal "${form.title}" dibuat.`, type: 'success' })
    setCreateOpen(false)
    setForm({ title:'', type:'Latihan Tim', date:'', start_time:'19:00', end_time:'21:00', location:'', notes:'', is_mandatory:true })
    setSaving(false)
  }

  async function deleteSession(s) {
    const { error } = await supabase.from('schedules').delete().eq('id', s.id)
    if (!error) {
      setSessions(prev => prev.filter(x => x.id !== s.id))
      addToast({ message: `"${s.title}" dihapus.`, type: 'success' })
    }
  }

  function countAvl(session, status) {
    return session.schedule_availability?.filter(a => a.status === status).length || 0
  }

  const upcoming = sessions.filter(s => s.date >= new Date().toISOString().split('T')[0])
  const past     = sessions.filter(s => s.date < new Date().toISOString().split('T')[0])

  return (
    <DashboardLayout title="Schedule">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Jadwal Tim</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Kelola jadwal latihan, scrim, dan tournament. Lihat ketersediaan pemain.</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => setCreateOpen(true)}>
          <Plus size={13} />Buat Jadwal
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
      ) : (
        <>
          {/* Upcoming */}
          <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
            Akan Datang ({upcoming.length})
          </p>
          {upcoming.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'32px 0', marginBottom:20 }}>
              <Calendar size={24} style={{ color:'var(--text-dim)', margin:'0 auto 8px' }} />
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Belum ada jadwal. Buat jadwal pertama kamu!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
              {upcoming.map(s => <SessionCard key={s.id} session={s} onDelete={deleteSession} countAvl={countAvl} />)}
            </div>
          )}

          {/* Past sessions */}
          {past.length > 0 && (
            <>
              <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
                Sudah Selesai ({past.length})
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, opacity:0.6 }}>
                {past.slice(-5).reverse().map(s => <SessionCard key={s.id} session={s} past onDelete={deleteSession} countAvl={countAvl} />)}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Jadwal Baru" size="md"
        footer={<><Button onClick={() => setCreateOpen(false)}>Batal</Button><Button variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Menyimpan...' : 'Buat Jadwal'}</Button></>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label className="form-label">Judul Sesi *</label><input className="form-input" placeholder="e.g. Latihan Rutin Malam" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="form-label">Tipe Sesi</label>
              <select className="form-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="form-label">Tanggal *</label><input type="date" className="form-input" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="form-label">Jam Mulai</label><input type="time" className="form-input" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} /></div>
            <div><label className="form-label">Jam Selesai</label><input type="time" className="form-input" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} /></div>
          </div>
          <div><label className="form-label">Lokasi / Platform</label><input className="form-input" placeholder="e.g. Discord Voice / Offline Warnet" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} /></div>
          <div><label className="form-label">Catatan (opsional)</label><textarea className="form-input" rows={2} placeholder="Instruksi atau informasi tambahan..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={form.is_mandatory} onChange={e=>setForm(f=>({...f,is_mandatory:e.target.checked}))} />
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Wajib hadir</span>
          </label>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function SessionCard({ session: s, onDelete, countAvl, past }) {
  const yes   = countAvl(s, 'yes')
  const no    = countAvl(s, 'no')
  const maybe = countAvl(s, 'maybe')
  const total = s.schedule_availability?.length || 0

  const TYPE_COLOR = {
    'Latihan Tim':'var(--brand)', 'Scrim':'var(--blue)', 'Tournament':'var(--green)',
    'Review/VOD':'var(--amber)', 'Physical Training':'#f87171', 'Meeting':'var(--text-muted)',
  }
  const color = TYPE_COLOR[s.session_type] || 'var(--brand)'

  return (
    <div className="card" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
      {/* Date column */}
      <div style={{ flexShrink:0, width:52, textAlign:'center', background:'var(--bg-elevated)', borderRadius:10, padding:'8px 4px', border:'1px solid var(--border-2)' }}>
        <p style={{ fontSize:18, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)', lineHeight:1 }}>
          {format(parseISO(s.date), 'd')}
        </p>
        <p style={{ fontSize:9, textTransform:'uppercase', color:'var(--text-dim)', marginTop:2, letterSpacing:'0.06em' }}>
          {format(parseISO(s.date), 'MMM', { locale: localeId })}
        </p>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: color, flexShrink:0 }} />
          <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{s.title}</p>
          {s.is_mandatory && <span className="badge badge-red" style={{ fontSize:9 }}>WAJIB</span>}
          <span className="badge badge-ocean" style={{ fontSize:9 }}>{s.session_type}</span>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.start_time} – {s.end_time}{s.location && ` · ${s.location}`}</p>
        {s.notes && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>{s.notes}</p>}

        {/* Availability summary */}
        {total > 0 && (
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <span style={{ fontSize:11, color:'var(--green)' }}>✓ {yes} bisa</span>
            <span style={{ fontSize:11, color:'var(--red)' }}>✗ {no} tidak</span>
            <span style={{ fontSize:11, color:'var(--amber)' }}>? {maybe} mungkin</span>
            <span style={{ fontSize:11, color:'var(--text-dim)' }}>{total - yes - no - maybe} belum</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!past && (
        <button className="btn btn-danger" style={{ padding:'5px 8px', flexShrink:0 }} onClick={() => onDelete(s)} title="Hapus jadwal">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
