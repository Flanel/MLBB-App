import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Menu, CheckCheck, Swords, Calendar, UserCheck, Link2, Info, X } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const TYPE_ICON  = { match:Swords, schedule:Calendar, approval:UserCheck, invite:Link2, info:Info }
const TYPE_COLOR = { match:'var(--brand)', schedule:'var(--blue)', approval:'var(--amber)', invite:'var(--green)', info:'var(--text-dim)' }

function timeAgo(dateStr) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix:true, locale:localeId }) } catch { return '' }
}

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { notifications, unread, markRead, markAllRead, loading } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function h(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  async function handleNotifClick(n) {
    if (!n.is_read) await markRead(n.id)
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 18px', flexShrink: 0, position: 'relative', zIndex: 100,
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="hamburger-btn"
        style={{ background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:5, display:'none', alignItems:'center', justifyContent:'center' }}
      >
        <Menu size={17} />
      </button>

      {/* Breadcrumb title */}
      <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:6 }}>
        {subtitle ? (
          <>
            <span style={{ fontSize:12.5, fontWeight:400, color:'var(--text-dim)', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            <ChevronRight size={11} style={{ color:'var(--border-3)', flexShrink:0 }} />
            <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-secondary)', fontFamily:'Syne,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{subtitle}</span>
          </>
        ) : (
          <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-secondary)', fontFamily:'Syne,sans-serif' }}>{title}</span>
        )}
      </div>

      {/* Notification Bell */}
      <div ref={dropRef} style={{ position:'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            position:'relative', width:30, height:30,
            display:'flex', alignItems:'center', justifyContent:'center',
            borderRadius:'var(--r-sm)',
            background: open ? 'var(--bg-elevated)' : 'transparent',
            border: open ? '1px solid var(--border-2)' : '1px solid transparent',
            color: open ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor:'pointer', transition:'all 0.1s',
          }}
        >
          <Bell size={14} strokeWidth={1.75} />
          {unread > 0 && (
            <span style={{
              position:'absolute', top:4, right:4,
              minWidth: unread > 9 ? 13 : 7, height: unread > 9 ? 13 : 7,
              borderRadius:9999, background:'var(--brand)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:8.5, fontWeight:700, color:'#041a17',
              padding: unread > 9 ? '0 3px' : 0,
            }}>
              {unread > 9 ? '9+' : ''}
            </span>
          )}
        </button>

        {open && (
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            width:320, maxHeight:460,
            background:'var(--bg-elevated)',
            border:'1px solid var(--border-2)',
            borderRadius:'var(--r-lg)',
            boxShadow:'var(--shadow-deep)',
            display:'flex', flexDirection:'column',
            overflow:'hidden', zIndex:200,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid var(--border-1)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <p style={{ fontSize:12.5, fontWeight:700, fontFamily:'Syne,sans-serif', color:'var(--text-primary)' }}>Notifikasi</p>
                {unread > 0 && (
                  <span style={{ background:'var(--red-bg)', color:'var(--red)', border:'1px solid var(--red-border)', fontSize:9.5, fontWeight:700, borderRadius:'var(--r-pill)', padding:'1px 6px' }}>
                    {unread} baru
                  </span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:10.5, display:'flex', alignItems:'center', gap:4, padding:'2px 6px', borderRadius:'var(--r-xs)', transition:'color 0.1s' }}>
                    <CheckCheck size={11} /> Baca semua
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:3, borderRadius:'var(--r-xs)' }}>
                  <X size={12} />
                </button>
              </div>
            </div>

            <div style={{ overflowY:'auto', flex:1 }}>
              {loading && notifications.length === 0 ? (
                <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontSize:12 }}>Memuat...</p>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <Bell size={24} style={{ color:'var(--text-dim)', margin:'0 auto 10px' }} />
                  <p style={{ fontSize:12.5, color:'var(--text-muted)' }}>Belum ada notifikasi</p>
                  <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>Match, jadwal, dan aktivitas tim muncul di sini.</p>
                </div>
              ) : notifications.slice(0,20).map(n => {
                const Icon  = TYPE_ICON[n.type] || Info
                const color = TYPE_COLOR[n.type] || 'var(--text-dim)'
                return (
                  <div key={n.id} onClick={() => handleNotifClick(n)}
                    style={{ display:'flex', gap:10, padding:'11px 14px', cursor:n.link?'pointer':'default', background:n.is_read?'transparent':'rgba(255,255,255,0.015)', borderBottom:'1px solid var(--border-0)', transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read?'transparent':'rgba(255,255,255,0.015)'}
                  >
                    <div style={{ width:28, height:28, borderRadius:'var(--r-sm)', flexShrink:0, background:`${color}14`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <p style={{ fontSize:12, fontWeight:n.is_read?400:600, color:n.is_read?'var(--text-secondary)':'var(--text-primary)', lineHeight:1.4 }}>{n.title}</p>
                        {!n.is_read && <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--brand)', flexShrink:0, marginTop:5 }} />}
                      </div>
                      {n.body && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</p>}
                      <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:3 }}>{timeAgo(n.created_at)}</p>
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
