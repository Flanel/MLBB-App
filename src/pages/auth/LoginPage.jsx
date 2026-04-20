import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const ROLE_REDIRECT = {
  super_admin:  '/super-admin',
  team_manager: '/team-manager',
  staff:        '/team-manager',
  player:       '/player',
}

function CrownMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M4 18L7 10L11 15L14 7L17 15L21 10L24 18H4Z"
        fill="none"
        stroke="#dde0ef"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 18H24V20H4V18Z" fill="#dde0ef" opacity="0.35" />
      <circle cx="14" cy="7" r="2.2" fill="#e11d48" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    navigate(ROLE_REDIRECT[profile?.role] || '/player', { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#080910' }}
    >
      {/* Background grid decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Red glow behind card */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center mb-4"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #161828 0%, #0c0d18 100%)',
              border: '1px solid #252840',
              boxShadow: '0 0 32px rgba(225,29,72,0.12)',
            }}
          >
            <CrownMark />
          </div>
          <p
            className="text-lg font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Syne, sans-serif', color: '#dde0ef', letterSpacing: '0.15em' }}
          >
            NOCTIS X KING
          </p>
          <p
            className="text-xs tracking-widest uppercase mt-0.5"
            style={{ color: '#3a3f5c', letterSpacing: '0.2em', fontFamily: 'Syne, sans-serif' }}
          >
            ESPORTS
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#0f1020',
            border: '1px solid #1e2135',
            borderRadius: 14,
            padding: '28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <p
            className="text-base font-semibold mb-1"
            style={{ fontFamily: 'Syne, sans-serif', color: '#dde0ef' }}
          >
            Sign in
          </p>
          <p className="text-xs mb-6" style={{ color: '#555a78' }}>
            Access your team dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="form-input"
                placeholder="you@team.gg"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{
                  background: 'rgba(225,29,72,0.08)',
                  border: '1px solid rgba(225,29,72,0.2)',
                  color: '#fb4c6c',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 mt-1"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '0.03em' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: '#3a3f5c' }}>
            Forgot your password? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}