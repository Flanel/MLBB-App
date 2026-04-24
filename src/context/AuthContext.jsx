
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  // FIX BUG #1 (refresh stuck):
  // - Removed fetchingRef guard — it was silently skipping legitimate profile
  //   fetches, leaving role=null permanently which caused ProtectedRoute to
  //   show the loading screen forever.
  // - Added profileLoadedRef to track whether we already have a role, so
  //   onAuthStateChange SIGNED_IN doesn't redundantly re-fetch.
  const initializedRef   = useRef(false)
  const profileLoadedRef = useRef(false)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      if (!profile) {
        setRole(null)
        setTeamActive(true)
        profileLoadedRef.current = false
        return
      }

      setRole(profile.role)
      profileLoadedRef.current = true

      if (profile.role !== 'super_admin' && profile.team_id) {
        setTeamActive(profile.teams?.is_active ?? true)
      } else {
        setTeamActive(true)
      }
    } catch {
      setRole(null)
      setTeamActive(true)
      profileLoadedRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        const u = session?.user ?? null
        setUser(u)
        if (u) await fetchProfile(u.id)

      } catch {

        if (mounted) {
          setUser(null)
          setRole(null)
          setTeamActive(true)
        }
      } finally {

        if (mounted) {
          setLoading(false)
          initializedRef.current = true
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'INITIAL_SESSION') return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        if (event === 'SIGNED_IN') {
          // FIX BUG #1: Only set loading=true when user explicitly signs in
          // (not on refresh). If init() already loaded the profile, skip.
          if (!profileLoadedRef.current) {
            setLoading(true)
            await fetchProfile(u.id)
            if (mounted) setLoading(false)
          }
        } else if (event !== 'TOKEN_REFRESHED') {
          await fetchProfile(u.id)
        }
      } else {
        setRole(null)
        setTeamActive(true)
        profileLoadedRef.current = false
      }

      if (!initializedRef.current) {
        if (mounted) setLoading(false)
        initializedRef.current = true
      }
    })

    init()

    return () => {
      mounted = false
      initializedRef.current   = false
      profileLoadedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setTeamActive(true)
    profileLoadedRef.current = false
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