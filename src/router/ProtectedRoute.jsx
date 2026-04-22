import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', flexDirection:'column', gap:16 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border-2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <polygon points="16,3 21,12 30,12 23,19 26,28 16,23 6,28 9,19 2,12 11,12" fill="none" stroke="var(--ocean-300)" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'var(--ocean-500)', opacity: 0.4, animation:'fadeIn 1s ease infinite', animationDelay:`${i*0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />

  return children
}
