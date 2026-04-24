import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

function LoadingScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', flexDirection:'column', gap:16 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <path d="M4 18L7 10L11 15L14 7L17 15L21 10L24 18H4Z" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="14" cy="7" r="2" fill="var(--brand)"/>
        </svg>
      </div>
      <div style={{ display:'flex', gap:5 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--brand)', opacity:0.5, animation:`fadeUp 0.8s ease ${i*0.2}s infinite alternate` }} />
        ))}
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, teamActive, loading } = useAuth()
  const location = useLocation()

  // FIX BUG #1: Safety timeout — if role stays null for > 8 seconds after
  // loading finishes, the profile fetch likely failed (RLS issue, network error).
  // Redirect to login instead of showing loading screen forever.
  const [roleTimeout, setRoleTimeout] = useState(false)
  useEffect(() => {
    if (user && role === null && !loading) {
      const timer = setTimeout(() => setRoleTimeout(true), 8000)
      return () => clearTimeout(timer)
    }
    setRoleTimeout(false)
  }, [user, role, loading])

  // Masih inisialisasi (getSession / fetchProfile belum selesai)
  if (loading) return <LoadingScreen />

  // Belum login sama sekali
  if (!user) return <Navigate to="/login" replace />

  // User ada tapi role belum di-load (fetchProfile masih jalan setelah SIGNED_IN)
  // Tampilkan loading, JANGAN redirect ke /login — ini yang menyebabkan login loop sebelumnya
  // KECUALI sudah timeout (profilefetch gagal silent)
  if (role === null) {
    if (roleTimeout) return <Navigate to="/login" replace />
    return <LoadingScreen />
  }

  if (!teamActive && role !== 'super_admin') {
    return <Navigate to="/login?reason=deactivated" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}