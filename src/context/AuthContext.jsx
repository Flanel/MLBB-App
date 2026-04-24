// 🔍 DEBUG VERSION — hapus console.log setelah bug ditemukan

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)

  console.log('🔄 [AuthProvider] render → loading:', loading, '| user:', user?.email || null, '| role:', role)

  const fetchProfile = useCallback(async (userId) => {
    console.log('📡 [fetchProfile] START → userId:', userId)
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      console.log('📡 [fetchProfile] RESPONSE → profile:', profile, '| error:', error)

      if (error || !profile) {
        console.warn('⚠️ [fetchProfile] No profile found or error! Setting role=null')
        setRole(null)
        setTeamActive(true)
        return
      }

      console.log('✅ [fetchProfile] Setting role:', profile.role)
      setRole(profile.role)

      if (profile.role !== 'super_admin' && profile.team_id) {
        setTeamActive(profile.teams?.is_active ?? true)
      } else {
        setTeamActive(true)
      }
    } catch (err) {
      console.error('❌ [fetchProfile] CATCH error:', err)
      setRole(null)
      setTeamActive(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    console.log('🟢 [AuthProvider] useEffect MOUNT')

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [onAuthStateChange] event:', event, '| session user:', session?.user?.email || null, '| mounted:', mounted)

      if (!mounted) {
        console.log('🚫 [onAuthStateChange] NOT mounted, skipping')
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 [onAuthStateChange] TOKEN_REFRESHED → skip profile fetch')
        return
      }

      const u = session?.user ?? null
      console.log('👤 [onAuthStateChange] setUser →', u?.email || null)
      setUser(u)

      if (u) {
        console.log('📡 [onAuthStateChange] Calling fetchProfile...')
        await fetchProfile(u.id)
        console.log('📡 [onAuthStateChange] fetchProfile DONE')
      } else {
        console.log('👤 [onAuthStateChange] No user → clearing role')
        setRole(null)
        setTeamActive(true)
      }

      if (mounted) {
        console.log('✅ [onAuthStateChange] setLoading(false)')
        setLoading(false)
      }
    })

    return () => {
      console.log('🔴 [AuthProvider] useEffect CLEANUP')
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  async function signOut() {
    console.log('🚪 [signOut] called')
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