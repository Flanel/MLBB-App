import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  // DEBUG: two separate queries to avoid RLS issues with cross-table joins
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, team_id')
        .eq('id', userId)
        .single()

      if (!profile) {
        setRole(null)
        setTeamActive(true)
        return
      }

      setRole(profile.role)

      // Check team active status separately (only for non-super-admin with a team)
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
      // DEBUG: if profile fetch fails entirely, don't block the app — let ProtectedRoute handle it
      setRole(null)
      setTeamActive(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) await fetchProfile(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await fetchProfile(u.id)
      } else {
        setRole(null)
        setTeamActive(true)
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

  return { user, role, teamActive, loading, signOut }
}