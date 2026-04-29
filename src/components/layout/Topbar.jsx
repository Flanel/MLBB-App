import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Menu, CheckCheck, Swords, Calendar, UserCheck, Info, X } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const TYPE_ICON  = { match:Swords, schedule:Calendar, approval:UserCheck, squad:UserCheck, info:Info }
const TYPE_COLOR = { match:'var(--brand)', schedule:'var(--blue)', approval:'var(--amber)', squad:'var(--amber)', info:'var(--text-dim)' }

function timeAgo(d) {
  try { return formatDistanceToNow(new Date(d), { addSuffix:true, locale:localeId }) } catch { return '' }
}

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { notifications, unread, markRead, markAllRead, loading } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  async function handleNotifClick(n) {
    if (!n.is_read) await markRead(n.id)
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  return (
    <header className="topbar">
      {/* Hamburger */}
      <button onClick={onMenuClick} className="hamburger-btn"
        style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:6, borderRadius:'var(--radius-sm)', display:'none', alignItems:'center' }}>
        <Menu size={18} />
      </button>

      {/* Breadcrumb title */}
      <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:6 }}>
        {subtitle ? (
          <>
            <span style={{ fontSize:14, fontWeight:400, color:'var(--text-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            <ChevronRight size={12} style={{ color:'var(--text-dim)', flexShrink:0 }} />
            <span className="topbar-title">{subtitle}</span>
          </>
        ) : (
          <span className="topbar-title">{title}</span>
        )}
      </div>

      {/* Bell */}
      <div ref={dropRef} style={{ position:'relative' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{
            position:'relative', width:34, height:34,
            display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius:'var(--radius-sm)',
            background: open ? 'var(--canvas-alt)' : 'transparent',
            border: open ? 'var(--border)' : '1px solid transparent',
            color: open ? 'var(--text-secondary)' : 'var(--text-dim)',
            cursor:'pointer', transition:'all 0.12s',
          }}>
          <Bell size={16} strokeWidth={1.75} />
          {unread > 0 && (
            <span style={{
              position:'absolute', top:6, right:6,
              minWidth:7, height:7, borderRadius:9999,
              background:'var(--brand)',
              border: '1.5px solid var(--canvas)',
            }}/>
          )}
        </button>

        {open && (
          <div style={{
            position:'absolute', top:'calc(100% + 8px)', right:0,
            width:340, maxHeight:480,
            background:'var(--canvas)',
            border:'var(--border-strong)',
            borderRadius:'var(--radius-xl)',
            boxShadow:'var(--shadow-deep)',
            display:'flex', flexDirection:'column',
            overflow:'hidden', zIndex:200,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', letterSpacing:'-0.1px' }}>Notifikasi</p>
                {unread > 0 && (
                  <span className="badge badge-red" style={{ fontSize:10 }}>{unread} baru</span>
                )}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {unread > 0 && (
                  <button onClick={markAllRead}
                    style={{ background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:4, padding:'3px 6px', borderRadius:'var(--radius-sm)' }}>
                    <CheckCheck size={12}/> Baca semua
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4, borderRadius:'var(--radius-sm)' }}>
                  <X size={13}/>
                </button>
              </div>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>
              {loading && notifications.length === 0 ? (
                <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <Bell size={28} style={{ color:'var(--text-dim)', margin:'0 auto 10px' }} />
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>Belum ada notifikasi</p>
                  <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4, lineHeight:1.5 }}>Notifikasi jadwal, tim, dan aktivitas muncul di sini.</p>
                </div>
              ) : notifications.slice(0,20).map(n => {
                const Icon  = TYPE_ICON[n.type]  || Info
                const color = TYPE_COLOR[n.type] || 'var(--text-dim)'
                return (
                  <div key={n.id} onClick={() => handleNotifClick(n)}
                    style={{
                      display:'flex', gap:12, padding:'12px 16px',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.is_read ? 'transparent' : 'rgba(225,29,72,0.03)',
                      borderBottom:'var(--border)',
                      transition:'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas-alt)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(225,29,72,0.03)'}
                  >
                    <div style={{ width:32, height:32, borderRadius:'var(--radius-md)', flexShrink:0, background:`${color}15`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <p style={{ fontSize:13, fontWeight: n.is_read ? 400 : 600, color: n.is_read ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight:1.4 }}>
                          {n.title}
                        </p>
                        {!n.is_read && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--brand)', flexShrink:0, marginTop:4 }}/>}
                      </div>
                      {n.body && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</p>}
                      <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
