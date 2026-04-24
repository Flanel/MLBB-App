// 🔍 DEBUG VERSION

import { Navigate, useLocation } from 'react-router-dom'
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

  console.log('🛡️ [ProtectedRoute] path:', location.pathname, '| loading:', loading, '| user:', user?.email || null, '| role:', role, '| teamActive:', teamActive)

  if (loading) {
    console.log('🛡️ [ProtectedRoute] → SHOWING LoadingScreen (loading=true)')
    return <LoadingScreen />
  }

  if (!user) {
    console.log('🛡️ [ProtectedRoute] → REDIRECT /login (no user)')
    return <Navigate to="/login" replace />
  }

  if (role === null) {
    console.log('🛡️ [ProtectedRoute] → REDIRECT /login (role=null, profile not found)')
    return <Navigate to="/login" replace />
  }

  if (!teamActive && role !== 'super_admin') {
    console.log('🛡️ [ProtectedRoute] → REDIRECT /login?reason=deactivated')
    return <Navigate to="/login?reason=deactivated" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log('🛡️ [ProtectedRoute] → REDIRECT /dashboard (role not allowed)')
    return <Navigate to="/dashboard" replace />
  }

  console.log('🛡️ [ProtectedRoute] → ✅ RENDERING children')
  return children
}