import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ExternalLink, Zap, ShieldCheck, ArrowRight } from 'lucide-react'

const TOPUP_URL = 'https://gamevaulto.com'

export default function TopUpPage() {
  const [clicked, setClicked] = useState(false)

  function handleTopUp() {
    setClicked(true)
    window.open(TOPUP_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <DashboardLayout title="Top Up">
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 12 }}>

        {/* Hero card */}
        <div className="card" style={{
          borderTop: '2px solid var(--brand)',
          textAlign: 'center',
          padding: '36px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            width: 52, height: 52, borderRadius: 'var(--r-md)',
            background: 'var(--brand-glow)', border: '1px solid var(--brand-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Zap size={22} style={{ color: 'var(--brand)' }} />
          </div>

          <p style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.4px', marginBottom:8 }}>
            Top Up Diamond
          </p>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:28, maxWidth:320, margin:'0 auto 28px' }}>
            Klik tombol di bawah untuk diarahkan ke platform top up resmi NXK Esports.
          </p>

          <button
            onClick={handleTopUp}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 'var(--r-sm)',
              background: clicked ? 'var(--bg-elevated)' : 'var(--brand)',
              border: clicked ? '1px solid var(--border-2)' : '1px solid var(--brand-dim)',
              color: clicked ? 'var(--text-secondary)' : '#041a17',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'Syne,sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => { if (!clicked) { e.currentTarget.style.background='var(--brand-hover)'; e.currentTarget.style.boxShadow='0 0 20px rgba(45,212,191,0.18)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = clicked ? 'var(--bg-elevated)' : 'var(--brand)'; e.currentTarget.style.boxShadow='none' }}
          >
            <ExternalLink size={14} />
            {clicked ? 'Buka Lagi' : 'Pergi ke GameVaulto'}
            <ArrowRight size={14} />
          </button>

          {clicked && (
            <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:12 }}>
              ✓ Halaman sudah dibuka di tab baru.
            </p>
          )}
        </div>

        {/* Info note */}
        <div style={{
          marginTop: 14,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-1)',
          borderRadius: 'var(--r-md)',
        }}>
          <ShieldCheck size={13} style={{ color:'var(--brand)', flexShrink:0 }} />
          <p style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.5 }}>
            Anda akan diarahkan ke <strong style={{ color:'var(--text-secondary)' }}>gamevaulto.com</strong> — platform top up resmi yang bekerja sama dengan NXK Esports.
          </p>
        </div>

      </div>
    </DashboardLayout>
  )
}
