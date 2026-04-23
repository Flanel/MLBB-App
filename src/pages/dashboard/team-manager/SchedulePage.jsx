import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle, HelpCircle, Trash2, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'

const SESSION_TYPES = ['Latihan Tim', 'Scrim', 'Tournament', 'Review/VOD', 'Physical Training', 'Meeting']

const TYPE_COLOR = {
  'Latihan Tim': 'var(--brand)', 'Scrim': 'var(--blue)', 'Tournament': 'var(--green)',
  'Review/VOD': 'var(--amber)', 'Physical Training': 'var(--red)', 'Meeting': 'var(--purple)',
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function SchedulePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [sessions, setSessions]       = useState([])
  const [teamId, setTeamId]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [createOpen, setCreateOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [form, setForm] = useState({
    title: '', type: 'Latihan Tim', date: '', start_time: '19:00', end_time: '21:00',
    location: '', notes: '', is_mandatory: true,
  })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)
      const { data } = await supabase
        .from('schedules')
        .select('*, schedule_availability(*, users(name))')
        .eq('team_id', profile.team_id)
        .order('date').order('start_time')
      setSessions(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  // Build map: dateString → sessions[]
  const sessionMap = useMemo(() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [sessions])

  // Calendar days for current month view
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const selectedKey     = format(selectedDate, 'yyyy-MM-dd')
  const selectedSessions = sessionMap[selectedKey] || []

  async function handleCreate() {
    if (!form.title.trim() || !form.date) {
      addToast({ message: 'Isi judul dan tanggal.', type: 'danger' })
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('schedules').insert({
      team_id: teamId, title: form.title.trim(), session_type: form.type,
      date: form.date, start_time: form.start_time, end_time: form.end_time,
      location: form.location || null, notes: form.notes || null,
      is_mandatory: form.is_mandatory, created_by: user.id,
    }).select().single()

    if (error) { addToast({ message: `Gagal: ${error.message}`, type: 'danger' }); setSaving(false); return }
    setSessions(prev => [...prev, { ...data, schedule_availability: [] }].sort((a, b) => a.date > b.date ? 1 : -1))
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Buat jadwal', target: form.title })
    addToast({ message: `Jadwal "${form.title}" dibuat.`, type: 'success' })
    setCreateOpen(false)
    // Navigate calendar to the new session's date
    const newDate = parseISO(form.date)
    setSelectedDate(newDate)
    setCurrentMonth(newDate)
    setForm({ title:'', type:'Latihan Tim', date:'', start_time:'19:00', end_time:'21:00', location:'', notes:'', is_mandatory:true })
    setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    // Bug 7 fix: delete schedule_availability first
    await supabase.from('schedule_availability').delete().eq('schedule_id', deleteTarget.id)
    const { error } = await supabase.from('schedules').delete().eq('id', deleteTarget.id)
    if (!error) {
      setSessions(prev => prev.filter(x => x.id !== deleteTarget.id))
      addToast({ message: `"${deleteTarget.title}" dihapus.`, type: 'success' })
    } else {
      addToast({ message: `Gagal: ${error.message}`, type: 'danger' })
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  function countAvl(session, status) {
    return session.schedule_availability?.filter(a => a.status === status).length || 0
  }

  const today = new Date()

  return (
    <DashboardLayout title="Schedule">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Jadwal Tim</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Kelola jadwal latihan, scrim, dan tournament.</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => {
          setForm(f => ({ ...f, date: selectedKey }))
          setCreateOpen(true)
        }}>
          <Plus size={13} />Buat Jadwal
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
      ) : (
        <div className="cal-layout" style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:16, alignItems:'start' }}>

          {/* ── Left: Calendar ── */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {/* Month header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border-1)' }}>
              <button className="btn" style={{ padding:'4px 8px' }} onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft size={13} />
              </button>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
              </p>
              <button className="btn" style={{ padding:'4px 8px' }} onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Day names */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'10px 12px 4px', gap:2 }}>
              {DAYS.map(d => (
                <p key={d} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:'var(--text-dim)', fontFamily:'Syne,sans-serif', letterSpacing:'0.05em' }}>
                  {d}
                </p>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'4px 12px 12px', gap:2 }}>
              {calDays.map(day => {
                const key      = format(day, 'yyyy-MM-dd')
                const hasSess  = !!sessionMap[key]?.length
                const isSelected = isSameDay(day, selectedDate)
                const isTod    = isToday(day)
                const inMonth  = isSameMonth(day, currentMonth)

                let cls = 'cal-day'
                if (!inMonth)    cls += ' other-month'
                else if (isSelected) cls += ' selected'
                else if (isTod)  cls += ' today'
                else if (hasSess) cls += ' has-event'

                return (
                  <div key={key} className={cls} onClick={() => { setSelectedDate(day); setCurrentMonth(day) }}>
                    {format(day, 'd')}
                    {hasSess && <span className="cal-dot" />}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ padding:'10px 16px 14px', borderTop:'1px solid var(--border-1)', display:'flex', flexWrap:'wrap', gap:10 }}>
              {Object.entries(TYPE_COLOR).map(([type, color]) => (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
                  <span style={{ fontSize:10, color:'var(--text-dim)' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Sessions for selected date ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
                </p>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {selectedSessions.length === 0 ? 'Tidak ada jadwal' : `${selectedSessions.length} sesi`}
                </p>
              </div>
              {isToday(selectedDate) && (
                <span className="badge badge-cyan" style={{ fontSize:10 }}>Hari Ini</span>
              )}
            </div>

            {selectedSessions.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:'40px 0' }}>
                <Calendar size={24} style={{ color:'var(--text-dim)', margin:'0 auto 8px' }} />
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>Tidak ada jadwal di hari ini.</p>
                <button className="btn btn-cyan" style={{ margin:'14px auto 0', display:'flex' }}
                  onClick={() => { setForm(f => ({ ...f, date: selectedKey })); setCreateOpen(true) }}>
                  <Plus size={12} />Buat Jadwal
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {selectedSessions.map(s => (
                  <SessionCard key={s.id} session={s} onDelete={setDeleteTarget} countAvl={countAvl} />
                ))}
              </div>
            )}

            {/* Upcoming mini list */}
            {sessions.filter(s => s.date > selectedKey).length > 0 && (
              <div style={{ marginTop:24 }}>
                <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
                  Jadwal Berikutnya
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {sessions.filter(s => s.date > selectedKey).slice(0, 4).map(s => (
                    <div key={s.id} className="card-elevated" style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', cursor:'pointer' }}
                      onClick={() => { const d = parseISO(s.date); setSelectedDate(d); setCurrentMonth(d) }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background: TYPE_COLOR[s.session_type] || 'var(--brand)', flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.title}</p>
                        <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:1 }}>
                          {format(parseISO(s.date), 'd MMM', { locale: localeId })} · {s.start_time}
                        </p>
                      </div>
                      {s.is_mandatory && <span className="badge badge-red" style={{ fontSize:9 }}>WAJIB</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
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

      {/* Bug 7 fix: Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Jadwal" size="sm"
        footer={<><Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button><Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button></>}
      >
        <div style={{ display:'flex', gap:14 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--red-bg)', border:'1px solid rgba(255,77,109,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Trash2 size={13} style={{ color:'var(--red)' }} />
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            <p>Hapus jadwal <strong style={{ color:'var(--text-primary)' }}>"{deleteTarget?.title}"</strong>?</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>Semua respon kehadiran pemain juga akan ikut terhapus.</p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function SessionCard({ session: s, onDelete, countAvl }) {
  const yes   = countAvl(s, 'yes')
  const no    = countAvl(s, 'no')
  const maybe = countAvl(s, 'maybe')
  const color = TYPE_COLOR[s.session_type] || 'var(--brand)'
  const isPast = s.date < new Date().toISOString().split('T')[0]

  return (
    <div className="card" style={{ opacity: isPast ? 0.65 : 1, borderLeft:`3px solid ${color}`, paddingLeft:14 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
            <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{s.title}</p>
            {s.is_mandatory && <span className="badge badge-red" style={{ fontSize:9 }}>WAJIB</span>}
            <span className="badge badge-cyan" style={{ fontSize:9 }}>{s.session_type}</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--text-muted)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11} />{s.start_time} – {s.end_time}</span>
            {s.location && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11} />{s.location}</span>}
          </div>
          {s.notes && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>{s.notes}</p>}
          {s.schedule_availability?.length > 0 && (
            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <span style={{ fontSize:11, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={10}/>{yes} bisa</span>
              <span style={{ fontSize:11, color:'var(--red)', display:'flex', alignItems:'center', gap:4 }}><XCircle size={10}/>{no} tidak</span>
              <span style={{ fontSize:11, color:'var(--amber)', display:'flex', alignItems:'center', gap:4 }}><HelpCircle size={10}/>{maybe} mungkin</span>
            </div>
          )}
        </div>
        {!isPast && (
          <button className="btn btn-danger" style={{ padding:'5px 8px', flexShrink:0 }} onClick={() => onDelete(s)} title="Hapus jadwal">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}