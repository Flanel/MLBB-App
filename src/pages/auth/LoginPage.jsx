import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import NXKLogo from '@/components/layout/NXKLogo'

const ROLE_REDIRECT = {
  super_admin: '/super-admin', team_manager: '/team-manager',
  staff: '/team-manager', player: '/player',
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Email atau password salah.'); setLoading(false); return }

    const { data: profile } = await supabase.from('users').select('role, team_id, is_active').eq('id', data.user.id).single()

    // Check if account is active (pending approval)
    if (profile?.is_active === false && profile?.role === 'player') {
      await supabase.auth.signOut()
      setError('Akunmu masih menunggu approval dari management tim. Coba lagi nanti.')
      setLoading(false)
      return
    }

    if (profile?.role !== 'super_admin' && profile?.team_id) {
      const { data: team } = await supabase.from('teams').select('is_active').eq('id', profile.team_id).single()
      if (team && !team.is_active) {
        await supabase.auth.signOut()
        setError('Tim kamu telah dinonaktifkan. Hubungi administrator.')
        setLoading(false)
        return
      }
    }

    navigate(ROLE_REDIRECT[profile?.role] || '/player', { replace: true })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px', background:'var(--bg-base)', position:'relative', overflow:'hidden' }}>
      {/* Grid bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      {/* Red glow */}
      <div style={{ position:'fixed', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle,rgba(225,29,72,0.07) 0%,transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:10 }}>
        {/* Brand — uses real NXK logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32 }}>
          <div style={{ width:80, height:80, borderRadius:20, overflow:'hidden', marginBottom:16, boxShadow:'0 0 48px rgba(225,29,72,0.18)' }}>
            <img src="/nxk-logo.png" alt="NXK Esports" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, letterSpacing:'0.12em', color:'var(--text-primary)' }}>NOCTIS X KING</p>
          <p style={{ fontSize:11, letterSpacing:'0.18em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif', marginTop:2 }}>ESPORTS MANAGEMENT</p>
        </div>

        {/* Card */}
        <div style={{ background:'#0f1020', border:'1px solid var(--border-1)', borderRadius:16, padding:'28px 28px 24px', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Sign in</p>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:24 }}>Akses dashboard tim kamu</p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="form-label">Email</label>
              <input type="email" required autoComplete="email" className="form-input" placeholder="email@tim.gg" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} required autoComplete="current-password" className="form-input"
                  placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:40 }} />
                <button type="button" onClick={()=>setShowPw(v=>!v)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2 }}>
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:'var(--red-bg)', border:'1px solid rgba(225,29,72,0.25)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'10px', marginTop:4, fontFamily:'Syne,sans-serif', letterSpacing:'0.03em' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize:11, textAlign:'center', marginTop:20, color:'var(--text-dim)' }}>
            Lupa password? Hubungi administrator.
          </p>
        </div>

        <p style={{ fontSize:10, textAlign:'center', marginTop:16, color:'var(--text-dim)', letterSpacing:'0.05em' }}>
          NXK ESPORTS · MANAGEMENT SYSTEM v2
        </p>
      </div>
    </div>
  )
}
