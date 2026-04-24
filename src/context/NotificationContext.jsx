// ─────────────────────────────────────────────────────────────────────────────
// NotificationContext.jsx
//
// Cara pakai:
//   1. Bungkus App dengan <NotificationProvider> di dalam AuthProvider
//   2. Di komponen manapun: const { notifications, unread, markRead, markAllRead, addNotif } = useNotifications()
//
// Cara trigger notifikasi dari halaman lain:
//   const { createNotif } = useNotifications()
//   await createNotif({ title: 'Match disimpan', body: 'vs Red Titans — Menang', type: 'match', link: '/team-manager/matches' })
//
// SQL Migration yang perlu dijalankan di Supabase:
// ─────────────────────────────────────────────────
//   CREATE TABLE notifications (
//     id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//     user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//     team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
//     title       TEXT NOT NULL,
//     body        TEXT,
//     type        TEXT DEFAULT 'info',   -- 'match' | 'schedule' | 'approval' | 'invite' | 'info'
//     link        TEXT,                  -- route target, e.g. '/team-manager/matches'
//     is_read     BOOLEAN DEFAULT FALSE,
//     created_at  TIMESTAMPTZ DEFAULT NOW()
//   );
//   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Users can see own notifications"
//     ON notifications FOR SELECT USING (auth.uid() = user_id);
//   CREATE POLICY "Service can insert notifications"
//     ON notifications FOR INSERT WITH CHECK (true);
//   CREATE POLICY "Users can update own notifications"
//     ON notifications FOR UPDATE USING (auth.uid() = user_id);
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const channelRef = useRef(null)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(data || [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (!user) { setNotifications([]); return }
    fetch()

    // Realtime: subscribe to new notifications for this user
    channelRef.current = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 50))
      })
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, fetch])

  const unread = notifications.filter(n => !n.is_read).length

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false)
  }

  // Utility: buat notifikasi untuk user lain atau diri sendiri
  async function createNotif({ userId, teamId, title, body, type = 'info', link }) {
    const targetUserId = userId || user?.id
    if (!targetUserId) return
    await supabase.from('notifications').insert({
      user_id:  targetUserId,
      team_id:  teamId || null,
      title,
      body:     body || null,
      type,
      link:     link || null,
      is_read:  false,
    })
  }

  // Broadcast notif ke semua member team (kecuali diri sendiri)
  async function notifyTeam({ teamId, excludeUserId, title, body, type, link }) {
    if (!teamId) return
    const { data: members } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', teamId)
      .neq('id', excludeUserId || user?.id)
      .eq('is_active', true)

    if (!members?.length) return
    const inserts = members.map(m => ({
      user_id: m.id, team_id: teamId, title, body: body || null,
      type: type || 'info', link: link || null, is_read: false,
    }))
    await supabase.from('notifications').insert(inserts)
  }

  return (
    <NotificationContext.Provider value={{
      notifications, unread, loading,
      markRead, markAllRead, createNotif, notifyTeam, refresh: fetch,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}