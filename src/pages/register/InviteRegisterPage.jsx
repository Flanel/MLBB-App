// InviteRegisterPage.jsx — Updated untuk multi-use invite tokens
//
// PERUBAHAN dari versi sebelumnya:
// ─────────────────────────────────────────────────────────────────
// SEBELUM: Token ditolak jika used_at sudah terisi (single-use only)
// SEKARANG:
//   1. Token valid selama belum expire DAN (max_uses null OR use_count < max_uses)
//   2. Setiap registrasi sukses: increment use_count (bukan set used_at)
//   3. used_at hanya diisi untuk tracking kapan pertama kali dipakai
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, CheckCircle, XCircle, Loader, AlertTriangle, Mail } from 'lucide-react'
import NXKLogo from '@/components/layout/NXKLogo'

const ESPORT_OPTIONS = [
  'Mobile Legends: Bang Bang', 'PUBG Mobile', 'Free Fire', 'Valorant',
  'League of Legends', 'Clash of Clans', 'Clash Royale', 'Honor of Kings', 'Lainnya',
]

const ROLE_LABEL = { player: 'Player', staff: 'Staff', team_manager: 'Team Manager' }

export default function InviteRegisterPage() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [tokenData,   setTokenData]   = useState(null)
  const [tokenStatus, setTokenStatus] = useState('loading')
  const [teamName,    setTeamName]    = useState('')
  const [step,        setStep]        = useState(1)

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

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

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

      // PERUBAHAN: Cek max_uses jika ada
      // Jika max_uses null → unlimited (hanya dibatasi expire)
      // Jika max_uses terisi → cek use_count
      const useCount = data.use_count ?? 0
      const maxUses  = data.max_uses
      if (maxUses != null && useCount >= maxUses) {
        setTokenStatus('full')  // Link sudah penuh
        return
      }

      setTokenData(data)
      setTeamName(data.teams?.name || '')
      setTokenStatus('valid')
    }
    fetchToken()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPw) { setError('Password tidak cocok.');        return }
    if (password.length < 8)    { setError('Password minimal 8 karakter.'); return }

    setSubmitting(true)
    try {
      const isPlayer = tokenData.role === 'player'

      // Step 1: Create Supabase auth user
      const { data: authData, error: signupErr } = await supabase.auth.signUp({ email, password })
      if (signupErr) throw new Error(signupErr.message)

      const userId = authData.user?.id
      if (!userId) throw new Error('Gagal membuat akun. Coba lagi.')

      // Step 2: Insert ke tabel users
      const insertData = isPlayer ? {
        id:          userId,
        email,
        name:        nickname,
        full_name:   fullName,
        birth_place: birthPlace || null,
        birth_date:  birthDate  || null,
        address:     address    || null,
        domicile:    domicile   || null,
        esport_type: esportType || null,
        role:        'player',
        team_id:     tokenData.team_id,
        is_active:   false, // player perlu approval
      } : {
        id:        userId,
        email,
        name:      staffName,
        role:      tokenData.role,
        team_id:   tokenData.team_id,
        is_active: true, // staff/manager langsung aktif
      }

      const { error: insertErr } = await supabase.from('users').insert(insertData)
      if (insertErr) throw new Error(insertErr.message)

      // Step 3: PERUBAHAN — increment use_count, jangan set used_at untuk blokir
      // used_at diisi hanya jika ini pertama kali dipakai (tracking saja)
      const currentUseCount = tokenData.use_count ?? 0
      const updateData = {
        use_count: currentUseCount + 1,
        // Set used_at hanya untuk first use tracking
        ...(currentUseCount === 0 ? { used_at: new Date().toISOString() } : {}),
      }
      await supabase.from('invite_tokens').update(updateData).eq('id', tokenData.id)

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
      invalid: { icon: XCircle,       color: 'var(--red)',   title: 'Link Tidak Valid',       body: 'Link undangan ini tidak ditemukan atau sudah tidak berlaku.' },
      expired: { icon: AlertTriangle, color: '#f59e0b',      title: 'Link Kedaluwarsa',       body: 'Link undangan ini telah melewati batas waktu 24 jam. Minta link baru dari tim kamu.' },
      full:    { icon: AlertTriangle, color: 'var(--brand)', title: 'Link Sudah Penuh',       body: 'Kuota link undangan ini sudah tercapai. Minta link baru dari tim kamu.' },
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

            {error && (
              <p style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(225,29,72,0.1)', borderRadius: 7, padding: '8px 12px' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
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