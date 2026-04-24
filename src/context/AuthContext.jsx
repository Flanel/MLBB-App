// ─────────────────────────────────────────────────────────────────────────────
// FIX: Stuck Loading Page on Refresh
//
// ROOT CAUSE 1 — Tidak ada try/catch di getSession():
//   getSession().then(callback) tanpa .catch() berarti jika getSession() reject
//   (network error, parse error, Supabase client gagal, dst.), atau jika
//   destructuring `{ data: { session } }` melempar error (data=null), maka
//   setLoading(false) TIDAK PERNAH dipanggil → stuck loading selamanya.
//
// ROOT CAUSE 2 — initializedRef TIDAK di-reset di cleanup (React StrictMode):
//   Di StrictMode (dev), React unmount→remount setiap komponen sekali.
//   Cleanup menjalankan: mounted=false, fetchingRef=false, unsubscribe.
//   TAPI initializedRef.current TIDAK di-reset ke false.
//   Jika getSession() dari run pertama sempat resolve & set initializedRef=true,
//   maka di run kedua: onAuthStateChange tidak punya jalan cadangan untuk
//   memanggil setLoading(false) (karena guard `!initializedRef.current` false).
//   Ini tidak langsung menyebabkan stuck, tapi menghilangkan safety net.
//
// ROOT CAUSE 3 — setLoading(false) tidak di finally block:
//   Jika fetchProfile() resolves dengan cara apapun tapi mounted sudah false
//   (edge case timing), `if (mounted) setLoading(false)` tidak terpanggil.
//   Di ZiDu App (referensi), setLoading(false) selalu ada di finally sehingga
//   pasti terpanggil apapun yang terjadi.
//
// FIX yang diambil dari referensi ZiDu App:
//   1. Bungkus init logic di async function dengan try/catch/finally
//   2. Pindahkan setLoading(false) ke finally block → selalu dipanggil
//   3. Reset initializedRef.current = false di cleanup (StrictMode safety)
// ─────────────────────────────────────────────────────────────────────────────

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

    // ─── FIX: Bungkus dalam async function dengan try/catch/finally ───────────
    // Sebelumnya: getSession().then(callback) tanpa .catch()
    //   → jika reject/throw → setLoading(false) tidak pernah dipanggil → STUCK
    //
    // Sekarang: setLoading(false) SELALU dipanggil di finally,
    //   apapun yang terjadi (sukses, error network, parse error, dll.)
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        const u = session?.user ?? null
        setUser(u)
        if (u) await fetchProfile(u.id)

      } catch {
        // getSession() atau fetchProfile() melempar error
        // (contoh: network down, Supabase URL salah, response tidak bisa di-parse)
        // Tetap lanjut — jangan biarkan app stuck di loading screen selamanya.
        // User akan dianggap belum login → ProtectedRoute redirect ke /login.
        if (mounted) {
          setUser(null)
          setRole(null)
          setTeamActive(true)
        }
      } finally {
        // ─── FIX UTAMA: setLoading(false) dijamin terpanggil ─────────────────
        // Baik sukses maupun error, loading PASTI di-clear di sini.
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
          // Pastikan loading=true saat fetch profile setelah login
          // agar ProtectedRoute tidak redirect ke /login karena role masih null.
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

    init()

    return () => {
      mounted = false
      fetchingRef.current    = false
      initializedRef.current = false
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