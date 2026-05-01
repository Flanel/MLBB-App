// AuthContext.jsx — Updated: tambah isCaptain detection
//
// PERUBAHAN:
//   - Tambah state isCaptain (boolean)
//   - Jika role === 'player', query team_lineup_members untuk cek is_captain
//   - isCaptain disediakan di context agar Sidebar bisa menampilkan menu Analytics

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [isCaptain, setIsCaptain]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const mountedRef = useRef(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      if (!mountedRef.current) return

      if (error || !profile) {
        setRole(null); setTeamActive(true); setIsCaptain(false)
        return
      }

      setRole(profile.role)
      if (profile.role !== 'super_admin' && profile.team_id) {
        setTeamActive(profile.teams?.is_active ?? true)
      } else {
        setTeamActive(true)
      }

      // Deteksi captain: player yang memiliki is_captain=true di lineup manapun
      if (profile.role === 'player') {
        const { data: captainRows } = await supabase
          .from('team_lineup_members')
          .select('id')
          .eq('player_id', userId)
          .eq('is_captain', true)
          .limit(1)
        if (mountedRef.current) {
          setIsCaptain(!!(captainRows && captainRows.length > 0))
        }
      } else {
        setIsCaptain(false)
      }
    } catch {
      if (!mountedRef.current) return
      setRole(null); setTeamActive(true); setIsCaptain(false)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[AuthContext] Safety timeout: setLoading(false) dipaksa setelah 8 detik')
        setLoading(false)
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      if (!mountedRef.current) return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        setTimeout(() => { if (mountedRef.current) fetchProfile(u.id) }, 0)
      } else {
        setRole(null); setTeamActive(true); setIsCaptain(false); setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setRole(null); setTeamActive(true); setIsCaptain(false)
  }

  return (
    <AuthContext.Provider value={{ user, role, teamActive, isCaptain, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}