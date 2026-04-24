// FIX BUG #1: Race condition login loop / stuck loading
// FIX BUG #7: fetchingRef tidak di-reset saat cleanup (React.StrictMode issue)
//
// Bug sebelumnya:
// - SIGNED_IN event membutuhkan setLoading(true→false) tapi jika LoginPage
//   navigate() lebih dulu sebelum event ini diproses, ProtectedRoute melihat
//   user=null → redirect /login → loop.
// - fetchingRef.current tidak di-reset di cleanup, sehingga di React.StrictMode
//   (double-invoke effects), ref bisa stuck = true → fetchProfile tidak pernah
//   jalan → loading tidak pernah di-set false.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  const fetchingRef    = useRef(false)
  const initializedRef = useRef(false)

  const fetchProfile = useCallback(async (userId) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      if (!profile) {
        setRole(null)
        setTeamActive(true)
        return
      }

      setRole(profile.role)

      if (profile.role !== 'super_admin' && profile.team_id) {
        setTeamActive(profile.teams?.is_active ?? true)
      } else {
        setTeamActive(true)
      }
    } catch {
      setRole(null)
      setTeamActive(true)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) await fetchProfile(u.id)
      if (mounted) {
        setLoading(false)
        initializedRef.current = true
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'INITIAL_SESSION') return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        if (event === 'SIGNED_IN') {
          // Pastikan loading=true saat fetch profile setelah login
          // agar ProtectedRoute tidak redirect ke /login karena role masih null.
          // LoginPage TIDAK boleh navigate() manual — biarkan perubahan user ini
          // yang men-trigger re-render ProtectedRoute secara alami.
          setLoading(true)
          await fetchProfile(u.id)
          if (mounted) setLoading(false)
        } else if (event !== 'TOKEN_REFRESHED') {
          await fetchProfile(u.id)
        }
      } else {
        setRole(null)
        setTeamActive(true)
      }

      if (!initializedRef.current) {
        if (mounted) setLoading(false)
        initializedRef.current = true
      }
    })

    return () => {
      mounted = false
      // FIX BUG #7: reset ref saat cleanup agar React.StrictMode double-invoke
      // tidak membuat fetchingRef stuck = true selamanya.
      fetchingRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setTeamActive(true)
  }

  return (
    <AuthContext.Provider value={{ user, role, teamActive, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
