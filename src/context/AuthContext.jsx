// ROOT CAUSE FIX — stuck loading setelah login
//
// Masalah yang terlihat di console:
//   [fetchProfile] START → userId: 9fc542a0...
//   <-- TIDAK ADA [fetchProfile] RESPONSE -->
//   Loading stuck selamanya.
//
// Kenapa hang?
//   fetchProfile memanggil supabase.from('users')
//   DI DALAM callback onAuthStateChange yang masih async/running.
//   Supabase client sedang busy memproses auth event → query baru masuk ke
//   internal lock → tidak pernah resolve → setLoading(false) tidak pernah jalan.
//
// Fix:
//   1. Bungkus fetchProfile call dengan setTimeout(0) untuk defer keluar dari
//      execution context onAuthStateChange, sehingga Supabase selesai memproses
//      auth event sebelum query baru dibuat.
//   2. Pindahkan setLoading(false) ke dalam fetchProfile (finally block) agar
//      loading state selalu resolved meski fetchProfile error/timeout.
//   3. Tambah safety timeout 8 detik sebagai jaring pengaman terakhir.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [role, setRole]             = useState(null)
  const [teamActive, setTeamActive] = useState(true)
  const [loading, setLoading]       = useState(true)
  const mountedRef = useRef(true)

  // FIX: fetchProfile sekarang memanggil setLoading(false) sendiri di finally,
  // sehingga loading selalu resolved bahkan kalau query error.
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, team_id, teams(is_active)')
        .eq('id', userId)
        .single()

      if (!mountedRef.current) return

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
      if (!mountedRef.current) return
      setRole(null)
      setTeamActive(true)
    } finally {
      // Selalu resolve loading di sini, bukan di caller
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Safety timeout: jika fetchProfile masih hang setelah 8 detik,
    // paksa setLoading(false) agar user tidak stuck selamanya.
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[AuthContext] Safety timeout: setLoading(false) dipaksa setelah 8 detik')
        setLoading(false)
      }
    }, 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // FIX: callback ini TIDAK async — tidak ada await di sini.
      // Semua async work dideferral lewat setTimeout(0).
      if (event === 'TOKEN_REFRESHED') return
      if (!mountedRef.current) return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        // FIX UTAMA: defer fetchProfile keluar dari execution context onAuthStateChange.
        // Tanpa setTimeout, supabase.from() dipanggil saat Supabase client masih
        // busy memproses auth event → query masuk ke internal lock → hang selamanya.
        setTimeout(() => {
          if (mountedRef.current) fetchProfile(u.id)
        }, 0)
      } else {
        setRole(null)
        setTeamActive(true)
        setLoading(false)
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