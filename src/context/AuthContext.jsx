// FIX BUG #1 (v2): Complete rewrite — single-path auth initialization.
//
// Root cause of "stuck loading on refresh":
//   The old code had TWO parallel paths: init() + onAuthStateChange.
//   They raced against each other, causing loading state to get stuck.
//
// Fix: Use onAuthStateChange as the ONLY source of truth.
//   - INITIAL_SESSION handles page refresh (fires immediately with stored session)
//   - SIGNED_IN handles explicit login
//   - TOKEN_REFRESHED is skipped (no profile change)
//   - No separate init() function → no race condition

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      if (error || !profile) {
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
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Single event handler — no separate init() needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Token refresh doesn't change the user profile
      if (event === 'TOKEN_REFRESHED') return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        await fetchProfile(u.id)
      } else {
        setRole(null)
        setTeamActive(true)
      }

      // Always resolve loading after processing
      if (mounted) setLoading(false)
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