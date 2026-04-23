import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  // Ref to prevent duplicate fetchProfile calls (e.g. getSession + onAuthStateChange firing simultaneously)
  const fetchingRef = useRef(false)
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

    // Inisialisasi: ambil session sekali saja
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) await fetchProfile(u.id)
      setLoading(false)
      initializedRef.current = true
    })

    // Listen perubahan auth (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Skip INITIAL_SESSION karena sudah ditangani getSession() di atas
      // Ini mencegah double-fetch saat pertama load
      if (event === 'INITIAL_SESSION') return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        // Hanya fetch profile jika bukan sekadar token refresh (SIGNED_IN dari persist)
        // TOKEN_REFRESHED tidak perlu re-fetch profile
        if (event !== 'TOKEN_REFRESHED') {
          await fetchProfile(u.id)
        }
      } else {
        setRole(null)
        setTeamActive(true)
      }

      // Pastikan loading false setelah event apapun
      if (!initializedRef.current) {
        setLoading(false)
        initializedRef.current = true
      }
    })

    return () => {
      mounted = false
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