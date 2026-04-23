import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser]           = useState(null)
  const [role, setRole]           = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]     = useState(true)

  // DEBUG: fetch role + team active status in one query to avoid race condition
  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('role, team_id, teams(is_active)')
      .eq('id', userId)
      .single()

    if (data) {
      setRole(data.role)
      // Super admin has no team — always active
      setTeamActive(data.role === 'super_admin' ? true : (data.teams?.is_active ?? true))
    } else {
      setRole(null)
      setTeamActive(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // DEBUG: initial session check — sets loading=false only after profile is fetched
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