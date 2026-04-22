import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CheckCircle, XCircle, HelpCircle, Calendar } from 'lucide-react'

const AVL = [
  { value:'yes',   label:'Bisa Hadir',  color:'var(--green)', bg:'var(--green-bg)', icon: CheckCircle },
  { value:'no',    label:'Tidak Bisa',  color:'var(--red)',   bg:'var(--red-bg)',   icon: XCircle },
  { value:'maybe', label:'Mungkin',     color:'var(--amber)', bg:'var(--amber-bg)', icon: HelpCircle },
]

const TYPE_COLOR = {
  'Latihan Tim':'var(--brand)', 'Scrim':'var(--blue)', 'Tournament':'var(--green)',
  'Review/VOD':'var(--amber)', 'Physical Training':'var(--red)', 'Meeting':'var(--text-muted)',
}

export default function PlayerSchedulePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState({})

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]
      const { data: sessData } = await supabase.from('schedules')
        .select('*, schedule_availability!inner(*)')
        .eq('team_id', profile.team_id)
        .gte('date', today)
        .order('date').order('start_time')

      // Also get sessions without availability response from this user
      const { data: allSess } = await supabase.from('schedules')
        .select('*, schedule_availability(id, user_id, status, notes)')
        .eq('team_id', profile.team_id)
        .gte('date', today)
        .order('date').order('start_time')

      setSessions(allSess || [])
      setLoading(false)
    }
    load()
  }, [user])

  function getMyAvl(s) {
    return s.schedule_availability?.find(a => a.user_id === user?.id)
  }

  async function respond(session, status) {
    setSaving(prev => ({ ...prev, [session.id]: true }))
    const existing = getMyAvl(session)

    if (existing) {
      await supabase.from('schedule_availability').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('schedule_availability').insert({ schedule_id: session.id, user_id: user.id, status })
    }

    setSessions(prev => prev.map(s => {
      if (s.id !== session.id) return s
      const filtered = (s.schedule_availability || []).filter(a => a.user_id !== user.id)
      return { ...s, schedule_availability: [...filtered, { user_id: user.id, status }] }
    }))
    addToast({ message: `Respon "${session.title}" disimpan.`, type:'success' })
    setSaving(prev => ({ ...prev, [session.id]: false }))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <DashboardLayout title="Jadwal Tim">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Jadwal Tim</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Lihat jadwal mendatang dan konfirmasi kehadiranmu.</p>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 0' }}>
          <Calendar size={32} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }} />
          <p style={{ fontSize:14, color:'var(--text-muted)', fontWeight:500 }}>Belum ada jadwal mendatang</p>
          <p style={{ fontSize:12, color:'var(--text-dim)', marginTop:4 }}>Manager tim kamu akan menambahkan jadwal di sini.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {sessions.map(s => {
            const myAvl = getMyAvl(s)
            const color = TYPE_COLOR[s.session_type] || 'var(--brand)'
            const isPast = s.date < today
            return (
              <div key={s.id} className="card" style={{ opacity: isPast ? 0.6 : 1 }}>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  {/* Date block */}
                  <div style={{ flexShrink:0, width:52, textAlign:'center', background:'var(--bg-elevated)', borderRadius:10, padding:'8px 4px', border:'1px solid var(--border-2)' }}>
                    <p style={{ fontSize:20, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)', lineHeight:1 }}>
                      {format(parseISO(s.date), 'd')}
                    </p>
                    <p style={{ fontSize:9, textTransform:'uppercase', color:'var(--text-dim)', marginTop:2, letterSpacing:'0.06em' }}>
                      {format(parseISO(s.date), 'MMM', { locale: localeId })}
                    </p>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background: color, flexShrink:0 }} />
                      <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{s.title}</p>
                      {s.is_mandatory && <span className="badge badge-red" style={{ fontSize:9 }}>WAJIB</span>}
                      <span className="badge badge-ocean" style={{ fontSize:9 }}>{s.session_type}</span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text-muted)' }}>{s.start_time} – {s.end_time}{s.location && ` · ${s.location}`}</p>
                    {s.notes && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>{s.notes}</p>}

                    {/* Availability buttons */}
                    {!isPast && (
                      <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                        {AVL.map(a => {
                          const Icon = a.icon
                          const isSelected = myAvl?.status === a.value
                          return (
                            <button key={a.value}
                              onClick={() => respond(s, a.value)}
                              disabled={saving[s.id]}
                              style={{
                                display:'flex', alignItems:'center', gap:6,
                                padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:500,
                                cursor:'pointer', transition:'all 0.15s', border:'1px solid',
                                background: isSelected ? a.bg : 'var(--bg-elevated)',
                                borderColor: isSelected ? a.color + '40' : 'var(--border-2)',
                                color: isSelected ? a.color : 'var(--text-muted)',
                              }}
                            >
                              <Icon size={13} />
                              {a.label}
                            </button>
                          )
                        })}
                        {myAvl && (
                          <span style={{ fontSize:11, color:'var(--text-dim)', alignSelf:'center', marginLeft:4 }}>
                            ✓ Responmu tersimpan
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
