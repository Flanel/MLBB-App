import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, team_id')
        .eq('id', userId)
        .single()

      if (!profile) { setRole(null); setTeamActive(true); return }

      setRole(profile.role)

      if (profile.role !== 'super_admin' && profile.team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('is_active')
          .eq('id', profile.team_id)
          .single()
        setTeamActive(team?.is_active ?? true)
      } else {
        setTeamActive(true)
      }
    } catch {
      setRole(null)
      setTeamActive(true)
    }
  }, [])

  useEffect(() => {
    // DEBUG: Supabase v2 fires INITIAL_SESSION immediately on subscribe.
    // Using ONLY onAuthStateChange (no getSession) avoids the StrictMode
    // race condition where getSession's setLoading(false) gets swallowed
    // because mounted=false after the first effect unmount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        setUser(u)

        if (u) {
          await fetchProfile(u.id)
        } else {
          setRole(null)
          setTeamActive(true)
        }

        // INITIAL_SESSION fires once at startup — this is the correct place
        // to turn off loading, regardless of whether user is logged in or not
        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setTeamActive(true)
  }

  return { user, role, teamActive, loading, signOut }
}