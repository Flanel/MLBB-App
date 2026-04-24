// Topbar.jsx — dengan Notification Dropdown yang berfungsi

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Menu, CheckCheck, Swords, Calendar, UserCheck, Link2, Info, X } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const TYPE_ICON = {
  match:    Swords,
  schedule: Calendar,
  approval: UserCheck,
  invite:   Link2,
  info:     Info,
}

const TYPE_COLOR = {
  match:    'var(--brand)',
  schedule: 'var(--blue)',
  approval: 'var(--amber)',
  invite:   '#22c55e',
  info:     'var(--text-dim)',
}

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: localeId })
  } catch { return '' }
}

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { notifications, unread, markRead, markAllRead, loading } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleNotifClick(n) {
    if (!n.is_read) await markRead(n.id)
    if (n.link) { navigate(n.link); setOpen(false) }
  }

  const recent = notifications.slice(0, 20)

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border-1)',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 20px', flexShrink: 0, position: 'relative', zIndex: 100,
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="hamburger-btn"
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer',
          padding: 4, borderRadius: 6,
          display: 'none', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Menu size={18} />
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {subtitle ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'Syne,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <ChevronRight size={12} style={{ color: 'var(--border-3)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</span>
          </>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif' }}>{title}</span>
        )}
      </div>

      {/* Bell Button */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            position: 'relative', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
            background: open ? 'var(--bg-elevated)' : 'transparent',
            border: open ? '1px solid var(--border-2)' : '1px solid transparent',
            color: open ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Bell size={15} strokeWidth={1.75} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              minWidth: unread > 9 ? 14 : 8, height: unread > 9 ? 14 : 8,
              borderRadius: 9999,
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
              fontFamily: 'IBM Plex Mono, monospace',
              padding: unread > 9 ? '0 3px' : 0,
            }}>
              {unread > 9 ? '9+' : ''}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 340, maxHeight: 480,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-2)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 200,
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--border-1)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: 'var(--text-primary)' }}>
                  Notifikasi
                </p>
                {unread > 0 && (
                  <span style={{
                    background: 'rgba(225,29,72,0.15)', color: 'var(--red)',
                    fontSize: 10, fontWeight: 700, borderRadius: 6,
                    padding: '2px 6px', fontFamily: 'IBM Plex Mono, monospace',
                  }}>
                    {unread} baru
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-dim)', cursor: 'pointer',
                      fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 6px', borderRadius: 6, transition: 'all 0.15s',
                    }}
                    title="Tandai semua dibaca"
                  >
                    <CheckCheck size={12} /> Baca semua
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && recent.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 12 }}>Memuat...</p>
              ) : recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Bell size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada notifikasi</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Notifikasi match, jadwal, dan aktivitas tim muncul di sini.</p>
                </div>
              ) : (
                recent.map(n => {
                  const Icon  = TYPE_ICON[n.type] || Info
                  const color = TYPE_COLOR[n.type] || 'var(--text-dim)'
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 16px',
                        cursor: n.link ? 'pointer' : 'default',
                        background: n.is_read ? 'transparent' : 'rgba(225,29,72,0.04)',
                        borderBottom: '1px solid var(--border-1)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(225,29,72,0.04)' }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: `${color}18`,
                        border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={14} style={{ color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <p style={{
                            fontSize: 12, fontWeight: n.is_read ? 500 : 600,
                            color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                            lineHeight: 1.4,
                          }}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 4 }} />
                          )}
                        </div>
                        {n.body && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.body}
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}