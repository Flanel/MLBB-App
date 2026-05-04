// Player SchedulePage v5
// Player hanya melihat jadwal yang relevan dengan Tim mereka
// + info Tim yang ditugaskan per jadwal

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CheckCircle, XCircle, HelpCircle, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Crown } from 'lucide-react'

const AVL = [
  { value:'yes',   label:'Bisa Hadir', color:'var(--green)', bg:'var(--green-bg)', icon:CheckCircle },
  { value:'no',    label:'Tidak Bisa', color:'var(--red)',   bg:'var(--red-bg)',   icon:XCircle },
  { value:'maybe', label:'Mungkin',    color:'var(--amber)', bg:'var(--amber-bg)', icon:HelpCircle },
]
const TYPE_COLOR = {
  'Latihan Tim':'var(--brand)','Scrim':'var(--blue)','Tournament':'var(--green)',
  'Review/VOD':'var(--amber)','Physical Training':'var(--red)','Meeting':'var(--purple)',
}
const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export default function PlayerSchedulePage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [sessions,     setSessions]     = useState([])
  const [myLineupIds,  setMyLineupIds]  = useState([]) // Tim mana saja player ini masuk
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState({})
  const [notesMap,     setNotesMap]     = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data:me } = await supabase.from('users').select('team_id').eq('id',user.id).single()
      if (!me?.team_id) { setLoading(false); return }

      // Cari Tim mana player ini terdaftar
      const { data:membership } = await supabase
        .from('team_lineup_members')
        .select('lineup_id')
        .eq('player_id', user.id)
      const ids = (membership||[]).map(m => m.lineup_id)
      setMyLineupIds(ids)

      // Ambil semua jadwal tim — yang punya lineup_id akan difilter di UI
      const { data:sched } = await supabase
        .from('schedules')
        .select('*, schedule_availability(id,user_id,status,notes), team_lineups(id,name,tag)')
        .eq('team_id', me.team_id)
        .order('date').order('start_time')

      setSessions(sched||[])
      const nm = {}
      ;(sched||[]).forEach(s => {
        const mine = s.schedule_availability?.find(a => a.user_id === user?.id)
        if (mine?.notes) nm[s.id] = mine.notes
      })
      setNotesMap(nm)
      setLoading(false)
    }
    load()
  }, [user])

  // Filter: tampilkan jadwal yang (a) tidak ada lineup_id = semua bisa lihat,
  // atau (b) lineup_id ada di tim player ini
  const visibleSessions = useMemo(() => {
    return sessions.filter(s => !s.lineup_id || myLineupIds.includes(s.lineup_id))
  }, [sessions, myLineupIds])

  const sessionMap = useMemo(() => {
    const map = {}
    visibleSessions.forEach(s => { if (!map[s.date]) map[s.date]=[]; map[s.date].push(s) })
    return map
  }, [visibleSessions])

  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn:0 })
    const end   = endOfWeek(endOfMonth(currentMonth),   { weekStartsOn:0 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const selectedKey      = format(selectedDate,'yyyy-MM-dd')
  const selectedSessions = sessionMap[selectedKey] || []

  function getMyAvl(s) { return s.schedule_availability?.find(a => a.user_id === user?.id) }

  async function respond(session, status) {
    setSaving(prev => ({ ...prev, [session.id]:true }))
    const existing = getMyAvl(session)
    const notes    = notesMap[session.id] || null

    if (existing) {
      await supabase.from('schedule_availability').update({ status, notes }).eq('id', existing.id)
    } else {
      await supabase.from('schedule_availability').insert({ schedule_id:session.id, user_id:user.id, status, notes })
    }
    setSessions(prev => prev.map(s => {
      if (s.id !== session.id) return s
      const filtered = (s.schedule_availability||[]).filter(a => a.user_id !== user.id)
      return { ...s, schedule_availability:[...filtered, { user_id:user.id, status, notes }] }
    }))
    addToast({ message:`Respon "${session.title}" disimpan.`, type:'success' })
    setSaving(prev => ({ ...prev, [session.id]:false }))
  }

  const today = new Date().toISOString().split('T')[0]
  const pendingCount = visibleSessions.filter(s => s.date >= today && !getMyAvl(s)).length

  return (
    <DashboardLayout title="Jadwal Tim">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Jadwal Tim</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>
          Lihat jadwal dan konfirmasi kehadiranmu.
          {myLineupIds.length>0 && <span style={{ color:'var(--amber)' }}> Kamu terdaftar di {myLineupIds.length} tim kompetitif.</span>}
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
      ) : (
        <div className="cal-layout">
          {/* Calendar */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border-1)' }}>
              <button className="btn" style={{ padding:'4px 8px' }} onClick={()=>setCurrentMonth(m=>subMonths(m,1))}><ChevronLeft size={13}/></button>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                {format(currentMonth,'MMMM yyyy',{locale:localeId})}
              </p>
              <button className="btn" style={{ padding:'4px 8px' }} onClick={()=>setCurrentMonth(m=>addMonths(m,1))}><ChevronRight size={13}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'10px 12px 4px', gap:2 }}>
              {DAYS.map(d=><p key={d} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:'var(--text-dim)', fontFamily:'Syne,sans-serif', letterSpacing:'0.05em' }}>{d}</p>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'4px 12px 12px', gap:2 }}>
              {calDays.map(day => {
                const key = format(day,'yyyy-MM-dd')
                const hasSess    = !!sessionMap[key]?.length
                const isSelected = isSameDay(day,selectedDate)
                const isTod      = isToday(day)
                const inMonth    = isSameMonth(day,currentMonth)
                let cls='cal-day'
                if (!inMonth) cls+=' other-month'
                else if (isSelected) cls+=' selected'
                else if (isTod) cls+=' today'
                else if (hasSess) cls+=' has-event'
                return (
                  <div key={key} className={cls} onClick={()=>{setSelectedDate(day);setCurrentMonth(day)}}>
                    {format(day,'d')}
                    {hasSess && <span className="cal-dot"/>}
                  </div>
                )
              })}
            </div>
            <div style={{ padding:'10px 16px 14px', borderTop:'1px solid var(--border-1)' }}>
              {pendingCount>0
                ? <p style={{ fontSize:11, color:'var(--amber)', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--amber)', display:'inline-block' }}/>
                    {pendingCount} jadwal belum dikonfirmasi
                  </p>
                : <p style={{ fontSize:11, color:'var(--green)' }}>✓ Semua jadwal sudah dikonfirmasi</p>
              }
            </div>
          </div>

          {/* Sessions */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
                  {format(selectedDate,'EEEE, d MMMM yyyy',{locale:localeId})}
                </p>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {selectedSessions.length===0?'Tidak ada jadwal':`${selectedSessions.length} sesi`}
                </p>
              </div>
              {isToday(selectedDate) && <span className="badge badge-cyan" style={{ fontSize:10 }}>Hari Ini</span>}
            </div>

            {selectedSessions.length===0 ? (
              <div className="card" style={{ textAlign:'center', padding:'40px 0' }}>
                <Calendar size={24} style={{ color:'var(--text-dim)', margin:'0 auto 8px' }}/>
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>Tidak ada jadwal di hari ini.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {selectedSessions.map(s => {
                  const myAvl  = getMyAvl(s)
                  const color  = TYPE_COLOR[s.session_type]||'var(--brand)'
                  const isPast = s.date < today
                  const lineup = s.team_lineups

                  return (
                    <div key={s.id} className="card" style={{ opacity:isPast?0.65:1, borderLeft:`3px solid ${color}`, paddingLeft:14 }}>
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                          <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{s.title}</p>
                          {s.is_mandatory && <span className="badge badge-red" style={{ fontSize:9 }}>WAJIB</span>}
                          <span className="badge badge-cyan" style={{ fontSize:9 }}>{s.session_type}</span>
                          {lineup && (
                            <span style={{ fontSize:10, display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, background:'rgba(245,158,11,0.1)', color:'#f59e0b', fontWeight:600 }}>
                              <Crown size={9} fill="#f59e0b"/>
                              {lineup.tag?`[${lineup.tag}] `:''}{lineup.name}
                            </span>
                          )}
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--text-muted)' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{s.start_time} – {s.end_time}</span>
                          {s.location && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{s.location}</span>}
                        </div>
                        {s.notes && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>{s.notes}</p>}
                      </div>

                      {!isPast && (
                        <div>
                          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-dim)', marginBottom:8, fontFamily:'Syne,sans-serif' }}>
                            Konfirmasi Kehadiran
                          </p>
                          {myAvl && (
                            <div style={{ marginBottom:8, padding:'6px 10px', borderRadius:7, background:'var(--bg-elevated)', fontSize:11, color:'var(--text-muted)' }}>
                              Status: <strong style={{ color:myAvl.status==='yes'?'var(--green)':myAvl.status==='no'?'var(--red)':'var(--amber)' }}>
                                {myAvl.status==='yes'?'Bisa Hadir':myAvl.status==='no'?'Tidak Bisa':'Mungkin'}
                              </strong>
                              {myAvl.notes && <span> · "{myAvl.notes}"</span>}
                            </div>
                          )}
                          <div style={{ marginBottom:10 }}>
                            <input className="form-input" placeholder="Alasan / catatan (opsional)"
                              style={{ fontSize:12 }}
                              value={notesMap[s.id]||''}
                              onChange={e => setNotesMap(prev => ({ ...prev, [s.id]:e.target.value }))} />
                          </div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {AVL.map(opt => {
                              const Ic = opt.icon
                              const active = myAvl?.status === opt.value
                              return (
                                <button key={opt.value} disabled={saving[s.id]} onClick={()=>respond(s,opt.value)}
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    padding:'5px 10px', borderRadius:7, fontSize:12, cursor:'pointer',
                                    fontFamily:'DM Sans,sans-serif', fontWeight:active?600:400,
                                    background:active?opt.bg:'var(--bg-elevated)',
                                    border:`1px solid ${active?'currentColor':'var(--border-2)'}`,
                                    color:active?opt.color:'var(--text-muted)',
                                    opacity:saving[s.id]?0.6:1,
                                  }}>
                                  <Ic size={11}/>{opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {isPast && myAvl && (
                        <p style={{ fontSize:11, color:'var(--text-dim)' }}>
                          Respon kamu: <strong style={{ color:myAvl.status==='yes'?'var(--green)':myAvl.status==='no'?'var(--red)':'var(--amber)' }}>
                            {myAvl.status==='yes'?'Hadir':myAvl.status==='no'?'Tidak Hadir':'Mungkin'}
                          </strong>
                          {myAvl.notes && <span> · "{myAvl.notes}"</span>}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}