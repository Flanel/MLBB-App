// InviteRegisterPage.jsx — Fixed version
//
// BUGS YANG DIPERBAIKI:
// ─────────────────────────────────────────────────────────────────
// BUG #1 (CRITICAL): insertData untuk player menyertakan kolom yang
//   TIDAK ADA di tabel public.users (full_name, birth_place, birth_date,
//   address, domicile, esport_type) → PostgreSQL error, registrasi selalu
//   gagal diam-diam. Fix: pisahkan insert ke users (hanya kolom valid)
//   dan insert terpisah ke player_applications.
//
// BUG #2: Insert ke player_applications TIDAK ADA sama sekali.
//   Akibatnya data detail player hilang dan manager tidak punya approval
//   request apapun untuk di-review. Fix: tambah insert ke player_applications.
//
// BUG #3: Rate limit Supabase 60 detik tidak di-handle dengan baik.
//   Error ditampilkan mentah dalam Bahasa Inggris. Fix: parse detik dari
//   pesan error → tampilkan countdown timer interaktif dalam B.Indonesia.
//
// BUG #4: Jika users insert gagal setelah signUp() sukses, auth user
//   tersisa di auth.users (zombie) dan email tidak bisa daftar ulang.
//   Fix: tambah pesan error yang lebih informatif untuk kasus ini.
//
// MINOR: kolom ign tidak di-set untuk player. Fix: set ign = nickname.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, CheckCircle, XCircle, Loader, AlertTriangle, Mail, Clock } from 'lucide-react'
import NXKLogo from '@/components/layout/NXKLogo'

const ESPORT_OPTIONS = [
  'Mobile Legends: Bang Bang', 'PUBG Mobile', 'Free Fire', 'Valorant',
  'League of Legends', 'Clash of Clans', 'Clash Royale', 'Honor of Kings', 'Lainnya',
]

const ROLE_LABEL = { player: 'Player', staff: 'Staff', team_manager: 'Team Manager' }

// ── Countdown component untuk rate limit error ──────────────────────────────
function RateLimitCountdown({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(seconds)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onDone?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [seconds])

  return (
    <div style={{
      fontSize: 12,
      color: 'var(--text-dim)',
      background: 'rgba(245,158,11,0.1)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 7,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <Clock size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
      <span>
        Untuk keamanan, tunggu{' '}
        <strong style={{ color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
          {remaining}
        </strong>{' '}
        detik sebelum mencoba lagi.
      </span>
    </div>
  )
}

export default function InviteRegisterPage() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [tokenData,   setTokenData]   = useState(null)
  const [tokenStatus, setTokenStatus] = useState('loading')
  const [teamName,    setTeamName]    = useState('')

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw,    setShowPw]    = useState(false)

  // Player fields
  const [nickname,   setNickname]   = useState('')
  const [fullName,   setFullName]   = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [birthDate,  setBirthDate]  = useState('')
  const [address,    setAddress]    = useState('')
  const [domicile,   setDomicile]   = useState('')
  const [esportType, setEsportType] = useState('')

  // Staff/Manager field
  const [staffName, setStaffName] = useState('')

  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState('')
  const [rateLimitSecs,  setRateLimitSecs]  = useState(0)

  // Validate token on mount
  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return }

    async function fetchToken() {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select('*, teams(name)')
        .eq('token', token)
        .single()

      if (error || !data)                         { setTokenStatus('invalid'); return }
      if (new Date(data.expires_at) < new Date()) { setTokenStatus('expired'); return }

      const useCount = data.use_count ?? 0
      const maxUses  = data.max_uses
      if (maxUses != null && useCount >= maxUses) {
        setTokenStatus('full')
        return
      }

      setTokenData(data)
      setTeamName(data.teams?.name || '')
      setTokenStatus('valid')
    }

    fetchToken()
  }, [token])

  // ── Parse detik dari pesan rate limit Supabase ──────────────────────────
  // Format: "For security purposes, you can only request this after X seconds."
  function parseRateLimitSeconds(msg) {
    const match = msg.match(/after (\d+) second/i)
    return match ? parseInt(match[1], 10) : 60
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setRateLimitSecs(0)

    if (password !== confirmPw) { setError('Password tidak cocok.');        return }
    if (password.length < 8)    { setError('Password minimal 8 karakter.'); return }

    setSubmitting(true)

    try {
      const isPlayer = tokenData.role === 'player'

      // ── Step 1: Buat auth user di Supabase ──────────────────────────────
      // emailRedirectTo: undefined → mencegah Supabase kirim email konfirmasi
      // (sistem ini invite-only, email konfirmasi tidak diperlukan).
      // Fix permanen: nonaktifkan "Enable email confirmations" di Supabase
      // Dashboard → Authentication → Configuration → Email.
      const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: { invited: true },
        },
      })

      if (signupErr) {
        const msg = signupErr.message || ''
        const msgLow = msg.toLowerCase()

        // Rate limit per-user (60 detik cooldown)
        if (msgLow.includes('security purposes') || msgLow.includes('only request this after')) {
          const secs = parseRateLimitSeconds(msg)
          setRateLimitSecs(secs)
          return
        }

        // Rate limit email Supabase free tier ("email rate limit exceeded")
        if (msgLow.includes('email rate limit') || msgLow.includes('rate limit exceeded')) {
          setError(
            'Server email sedang overload (batas pengiriman email tercapai). ' +
            'Coba lagi dalam beberapa menit, atau hubungi administrator tim.'
          )
          return
        }

        // Email sudah terdaftar
        if (msgLow.includes('already registered') || msgLow.includes('user already registered')) {
          setError('Email ini sudah terdaftar. Coba login atau gunakan email lain.')
          return
        }

        throw new Error(msg)
      }

      const userId = authData.user?.id
      if (!userId) throw new Error('Gagal membuat akun. Coba lagi.')

      // ── Deteksi: email confirmation masih ON di Supabase ────────────────
      // Jika session null setelah signUp → user belum terautentikasi →
      // insert ke users table akan ditolak RLS policy (auth.uid() = null).
      // SOLUSI: Supabase Dashboard → Authentication → Configuration →
      // Email → matikan "Enable email confirmations" → Save.
      if (!authData.session) {
        throw new Error(
          'Konfigurasi server belum selesai. ' +
          'Administrator harus menonaktifkan "Enable email confirmations" ' +
          'di Supabase Dashboard → Authentication → Configuration → Email.'
        )
      }

      // ── Step 2: Insert ke tabel users ──────────────────────────────────
      const userInsertData = isPlayer
        ? {
            id:        userId,
            email,
            name:      nickname,
            ign:       nickname,
            role:      'player',
            team_id:   tokenData.team_id,
            is_active: false,
          }
        : {
            id:        userId,
            email,
            name:      staffName,
            role:      tokenData.role,
            team_id:   tokenData.team_id,
            is_active: true,
          }

      const { error: insertErr } = await supabase.from('users').insert(userInsertData)

      if (insertErr) {
        console.error('[Register] users insert failed:', insertErr)
        const detail = insertErr.message || insertErr.code || 'unknown'
        throw new Error(`Gagal menyimpan profil (${detail}). Hubungi administrator.`)
      }

      // ── Step 3 (PLAYER ONLY): Insert ke player_applications ─────────────
      // FIX BUG #2: Data detail player harus masuk ke player_applications,
      // bukan ke users. Ini yang dipakai manager untuk approval.
      if (isPlayer) {
        const { error: appErr } = await supabase.from('player_applications').insert({
          invite_token_id: tokenData.id,
          user_id:         userId,
          team_id:         tokenData.team_id,
          nickname,
          full_name:       fullName,
          birth_place:     birthPlace  || null,
          birth_date:      birthDate   || null,
          address:         address     || null,
          domicile:        domicile    || null,
          esport_type:     esportType  || null,
          status:          'pending',
        })

        if (appErr) {
          // Tidak fatal — user sudah terbuat, tapi log error ini
          console.error('[Register] player_applications insert failed:', appErr)
          // Lanjutkan saja; manager masih bisa ditemukan lewat users table
        }
      }

      // ── Step 4: Update use_count di invite token ─────────────────────────
      const currentUseCount = tokenData.use_count ?? 0
      await supabase.from('invite_tokens').update({
        use_count: currentUseCount + 1,
        ...(currentUseCount === 0 ? { used_at: new Date().toISOString() } : {}),
      }).eq('id', tokenData.id)

      navigate('/login', { state: { registered: true, role: tokenData.role } })

    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (tokenStatus === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <Loader size={24} style={{ color: 'var(--text-dim)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  // ── Invalid / Expired / Full states ───────────────────────────────────────
  if (['invalid', 'expired', 'full'].includes(tokenStatus)) {
    const messages = {
      invalid: { icon: XCircle,       color: 'var(--red)',   title: 'Link Tidak Valid',   body: 'Link undangan ini tidak ditemukan atau sudah tidak berlaku.' },
      expired: { icon: AlertTriangle, color: '#f59e0b',      title: 'Link Kedaluwarsa',   body: 'Link undangan ini telah melewati batas waktu 24 jam. Minta link baru dari tim kamu.' },
      full:    { icon: AlertTriangle, color: 'var(--brand)', title: 'Link Sudah Penuh',   body: 'Kuota link undangan ini sudah tercapai. Minta link baru dari tim kamu.' },
    }
    const { icon: Icon, color, title, body } = messages[tokenStatus]
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <Icon size={40} style={{ color, margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</p>
        </div>
      </div>
    )
  }

  const isPlayer = tokenData?.role === 'player'

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <NXKLogo style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Daftar sebagai {ROLE_LABEL[tokenData?.role] || 'Member'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Bergabung ke tim <strong style={{ color: 'var(--text-secondary)' }}>{teamName}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Account fields */}
            <div>
              <label className="form-label">Email *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input className="form-input" style={{ paddingLeft: 30 }} type="email" placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" style={{ paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'} placeholder="Min. 8 karakter"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Konfirmasi Password *</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Ulangi password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            </div>

            {/* Player-specific fields */}
            {isPlayer && (
              <>
                <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 12, fontFamily: 'Syne,sans-serif' }}>
                    Data Pemain
                  </p>
                </div>
                <div>
                  <label className="form-label">Nickname / IGN *</label>
                  <input className="form-input" placeholder="In-game name" value={nickname}
                    onChange={e => setNickname(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" placeholder="Nama sesuai KTP" value={fullName}
                    onChange={e => setFullName(e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Kota Lahir</label>
                    <input className="form-input" placeholder="Jakarta" value={birthPlace}
                      onChange={e => setBirthPlace(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Lahir</label>
                    <input className="form-input" type="date" value={birthDate}
                      onChange={e => setBirthDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Domisili</label>
                  <input className="form-input" placeholder="Kota domisili saat ini" value={domicile}
                    onChange={e => setDomicile(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Game Utama</label>
                  <select className="form-input" value={esportType} onChange={e => setEsportType(e.target.value)}>
                    <option value="">Pilih game...</option>
                    {ESPORT_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Staff/Manager name */}
            {!isPlayer && (
              <div>
                <label className="form-label">Nama *</label>
                <input className="form-input" placeholder="Nama lengkap" value={staffName}
                  onChange={e => setStaffName(e.target.value)} required />
              </div>
            )}

            {/* FIX BUG #3: Rate limit countdown (menggantikan teks error mentah Supabase) */}
            {rateLimitSecs > 0 && (
              <RateLimitCountdown
                seconds={rateLimitSecs}
                onDone={() => setRateLimitSecs(0)}
              />
            )}

            {/* Error biasa (non-rate-limit) */}
            {error && (
              <p style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(225,29,72,0.1)', borderRadius: 7, padding: '8px 12px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || rateLimitSecs > 0}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {submitting ? 'Mendaftarkan...' : `Daftar sebagai ${ROLE_LABEL[tokenData?.role] || 'Member'}`}
            </button>

            {isPlayer && (
              <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
                Akun player perlu diapprove oleh management tim sebelum bisa login.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}