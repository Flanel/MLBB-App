// InviteRegisterPage.jsx — v4
// Security: honeypot, input sanitization, rate limit, token UUID validation
// Regional: Provinsi + Kota (ganti Alamat Lengkap)

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizeName, sanitizeIGN, sanitizeEmail, sanitizeText, isValidToken, isValidEmail, isBot } from '@/lib/sanitize'
import { Eye, EyeOff, CheckCircle, XCircle, Loader, AlertTriangle, Mail, Clock, Shield } from 'lucide-react'
import NXKLogo from '@/components/layout/NXKLogo'

const ESPORT_OPTIONS = [
  'Mobile Legends: Bang Bang','PUBG Mobile','Free Fire','Valorant',
  'League of Legends','Clash of Clans','Clash Royale','Honor of Kings','Lainnya',
]
const ROLE_LABEL = { player:'Player', staff:'Staff', team_manager:'Team Manager' }

// 34 Provinsi Indonesia
const PROVINCES = [
  'Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau',
  'Jambi','Sumatera Selatan','Kepulauan Bangka Belitung','Bengkulu','Lampung',
  'DKI Jakarta','Jawa Barat','Banten','Jawa Tengah','DI Yogyakarta','Jawa Timur',
  'Bali','Nusa Tenggara Barat','Nusa Tenggara Timur',
  'Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara',
  'Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara',
  'Maluku','Maluku Utara',
  'Papua','Papua Barat','Papua Selatan','Papua Tengah','Papua Pegunungan','Papua Barat Daya',
]

function RateLimitCountdown({ seconds, onDone }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    setRem(seconds)
    const iv = setInterval(() => setRem(p => {
      if (p <= 1) { clearInterval(iv); onDone?.(); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [seconds])
  return (
    <div style={{ fontSize:12, color:'var(--text-dim)', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:7, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
      <Clock size={14} style={{ color:'#f59e0b', flexShrink:0 }} />
      <span>Tunggu <strong style={{ color:'#f59e0b' }}>{rem}</strong> detik sebelum mencoba lagi.</span>
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
  const [province,   setProvince]   = useState('')  // ganti address → regional
  const [city,       setCity]       = useState('')
  const [esportType, setEsportType] = useState('')

  // Staff/Manager
  const [staffName, setStaffName] = useState('')

  // Honeypot — harus tetap kosong; bot biasanya isi otomatis
  const [honeypot, setHoneypot] = useState('')

  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState('')
  const [rateLimitSecs, setRateLimitSecs] = useState(0)
  const submitCount = useRef(0)

  useEffect(() => {
    // Validasi format token sebelum query ke DB (cegah injection via URL)
    if (!token) { setTokenStatus('invalid'); return }
    if (!isValidToken(token)) { setTokenStatus('invalid'); return }

    async function fetchToken() {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select('*, teams(name)')
        .eq('token', token)
        .single()

      if (error || !data) { setTokenStatus('invalid'); return }
      if (new Date(data.expires_at) < new Date()) { setTokenStatus('expired'); return }
      const useCount = data.use_count ?? 0
      if (data.max_uses != null && useCount >= data.max_uses) { setTokenStatus('full'); return }

      setTokenData(data)
      setTeamName(data.teams?.name || '')
      setTokenStatus('valid')
    }
    fetchToken()
  }, [token])

  function parseRateLimitSecs(msg) {
    const m = msg.match(/after (\d+) second/i)
    return m ? parseInt(m[1], 10) : 60
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setRateLimitSecs(0)

    // Honeypot check — jika terisi = bot
    if (isBot(honeypot)) {
      console.warn('[Security] Honeypot triggered — bot detected')
      return
    }

    // Client-side rate limit
    submitCount.current += 1
    if (submitCount.current > 5) {
      setError('Terlalu banyak percobaan. Refresh halaman dan coba lagi.')
      return
    }

    const role      = tokenData?.role
    const isPlayer  = role === 'player'
    const isManager = role === 'team_manager'

    // Sanitize semua input
    const cleanEmail    = sanitizeEmail(email)
    const cleanPassword = password // jangan sanitize password
    const cleanNickname = sanitizeIGN(nickname)
    const cleanFullName = sanitizeName(fullName)
    const cleanBirthPlace = sanitizeName(birthPlace)
    const cleanProvince = sanitizeText(province, 50)
    const cleanCity     = sanitizeName(city)
    const cleanStaff    = sanitizeName(staffName)

    // Validasi
    if (!isValidEmail(cleanEmail)) { setError('Format email tidak valid.'); return }
    if (cleanPassword !== confirmPw) { setError('Password tidak cocok.'); return }
    if (cleanPassword.length < 8)   { setError('Password minimal 8 karakter.'); return }
    if (cleanPassword.length > 128) { setError('Password terlalu panjang.'); return }

    if (isPlayer) {
      if (!cleanNickname)   { setError('Nickname / IGN wajib diisi.'); return }
      if (!cleanFullName)   { setError('Nama Lengkap wajib diisi.'); return }
      if (!cleanBirthPlace) { setError('Kota Lahir wajib diisi.'); return }
      if (!birthDate)       { setError('Tanggal Lahir wajib diisi.'); return }
      if (!cleanProvince)   { setError('Provinsi wajib dipilih.'); return }
      if (!cleanCity.trim()) { setError('Kota/Kabupaten wajib diisi.'); return }
      if (!esportType)      { setError('Game Utama wajib dipilih.'); return }
    } else {
      if (!cleanStaff) { setError('Nama wajib diisi.'); return }
    }

    setSubmitting(true)
    try {
      const { data: authData, error: signupErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { emailRedirectTo: undefined, data: { invited: true } },
      })

      if (signupErr) {
        const msg = signupErr.message || ''
        const low = msg.toLowerCase()
        if (low.includes('security purposes') || low.includes('only request this after')) {
          setRateLimitSecs(parseRateLimitSecs(msg)); return
        }
        if (low.includes('rate limit')) {
          setError('Server sedang sibuk. Coba lagi dalam beberapa menit.'); return
        }
        if (low.includes('already registered')) {
          setError('Email sudah terdaftar. Coba login atau gunakan email lain.'); return
        }
        throw new Error(msg)
      }

      const userId = authData.user?.id
      if (!userId) throw new Error('Gagal membuat akun.')
      if (authData.user?.identities?.length === 0) {
        setError('Email sudah terdaftar. Coba login atau gunakan email lain.'); return
      }
      if (!authData.session) {
        throw new Error('Konfigurasi server belum selesai. Hubungi administrator.')
      }

      const isActive = !isManager

      const userInsertData = isPlayer
        ? {
            id: userId, email: cleanEmail,
            name: cleanNickname, ign: cleanNickname,
            role: 'player', team_id: tokenData.team_id, is_active: isActive,
          }
        : {
            id: userId, email: cleanEmail,
            name: cleanStaff,
            role: tokenData.role, team_id: tokenData.team_id, is_active: isActive,
          }

      const { error: insertErr } = await supabase.from('users').upsert(userInsertData, { onConflict: 'id' })
      if (insertErr) throw new Error(`Gagal menyimpan profil (${insertErr.message}). Hubungi admin.`)

      // Simpan player_applications dengan kolom regional
      if (isPlayer) {
        const { data: existingApp } = await supabase
          .from('player_applications')
          .select('id').eq('user_id', userId).single()

        if (!existingApp) {
          const { error: appErr } = await supabase.from('player_applications').insert({
            invite_token_id: tokenData.id,
            user_id:     userId,
            team_id:     tokenData.team_id,
            nickname:    cleanNickname,
            full_name:   cleanFullName,
            birth_place: cleanBirthPlace,
            birth_date:  birthDate,
            province:    cleanProvince,
            city:        cleanCity,
            esport_type: esportType,
            status:      'approved', // langsung aktif
          })
          if (appErr) console.warn('[Register] player_applications insert failed:', appErr.message)
        }
      }

      if (isManager) {
        await supabase.from('manager_pending_approvals').insert({
          user_id: userId, team_id: tokenData.team_id,
          name: cleanStaff, email: cleanEmail, status: 'pending',
        }).then(() => {}).catch(() => {})
      }

      const currentCount = tokenData.use_count ?? 0
      await supabase.from('invite_tokens').update({
        use_count: currentCount + 1,
        ...(currentCount === 0 ? { used_at: new Date().toISOString() } : {}),
      }).eq('id', tokenData.id)

      navigate('/login', {
        state: { registered: true, role: tokenData.role, pendingApproval: isManager }
      })

    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (tokenStatus === 'loading') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)' }}>
      <Loader size={24} style={{ color:'var(--text-dim)', animation:'spin 1s linear infinite' }} />
    </div>
  )

  if (['invalid','expired','full'].includes(tokenStatus)) {
    const M = {
      invalid: { icon:XCircle,       color:'var(--red)',   title:'Link Tidak Valid',  body:'Link undangan ini tidak ditemukan atau sudah tidak berlaku.' },
      expired: { icon:AlertTriangle, color:'#f59e0b',      title:'Link Kedaluwarsa',  body:'Link undangan ini telah kedaluwarsa. Minta link baru dari tim kamu.' },
      full:    { icon:AlertTriangle, color:'var(--brand)', title:'Link Penuh',        body:'Kuota link ini sudah tercapai. Minta link baru dari tim kamu.' },
    }
    const { icon:Icon, color, title, body } = M[tokenStatus]
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)', padding:20 }}>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          <Icon size={40} style={{ color, margin:'0 auto 16px' }} />
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{title}</h2>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{body}</p>
        </div>
      </div>
    )
  }

  const isPlayer  = tokenData?.role === 'player'
  const isManager = tokenData?.role === 'team_manager'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-deep)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <NXKLogo style={{ margin:'0 auto 16px' }} />
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>
            Daftar sebagai {ROLE_LABEL[tokenData?.role] || 'Member'}
          </h1>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>
            Bergabung ke tim <strong style={{ color:'var(--text-secondary)' }}>{teamName}</strong>
          </p>
          {isManager && (
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:8 }}>
              <p style={{ fontSize:11, color:'#f59e0b' }}>⚠️ Akun Team Manager memerlukan verifikasi Super Admin sebelum bisa login.</p>
            </div>
          )}
          <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontSize:10, color:'var(--text-dim)' }}>
            <Shield size={10} /><span>Formulir ini dilindungi keamanan berlapis</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot — disembunyikan dari manusia, bot isi otomatis */}
          <div style={{ display:'none' }} aria-hidden="true">
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Akun */}
            <div>
              <label className="form-label">Email *</label>
              <div style={{ position:'relative' }}>
                <Mail size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-dim)' }} />
                <input className="form-input" style={{ paddingLeft:30 }} type="email" placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} maxLength={100} required />
              </div>
            </div>
            <div>
              <label className="form-label">Password *</label>
              <div style={{ position:'relative' }}>
                <input className="form-input" style={{ paddingRight:36 }}
                  type={showPw ? 'text' : 'password'} placeholder="Min. 8 karakter, maks. 128"
                  value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={128} required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Konfirmasi Password *</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Ulangi password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            </div>

            {/* Player fields */}
            {isPlayer && (
              <>
                <div style={{ borderTop:'1px solid var(--border-1)', paddingTop:14 }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:12, fontFamily:'Syne,sans-serif' }}>Data Pemain</p>
                </div>

                <div>
                  <label className="form-label">Nickname / IGN *</label>
                  <input className="form-input" placeholder="In-game name" maxLength={30}
                    value={nickname} onChange={e => setNickname(e.target.value)} required />
                  <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:3 }}>Hanya huruf, angka, titik, strip, spasi.</p>
                </div>

                <div>
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" placeholder="Nama sesuai KTP" maxLength={100}
                    value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label className="form-label">Kota Lahir *</label>
                    <input className="form-input" placeholder="Jakarta" maxLength={60}
                      value={birthPlace} onChange={e => setBirthPlace(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Lahir *</label>
                    <input className="form-input" type="date"
                      value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
                  </div>
                </div>

                {/* Regional — ganti Alamat Lengkap */}
                <div style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'12px 14px', border:'1px solid var(--border-1)' }}>
                  <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>Regional Domisili</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div>
                      <label className="form-label">Provinsi *</label>
                      <select className="form-input" value={province} onChange={e => setProvince(e.target.value)} required>
                        <option value="">Pilih Provinsi...</option>
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Kota / Kabupaten *</label>
                      <input className="form-input" placeholder="e.g. Jakarta Selatan, Surabaya, Makassar" maxLength={80}
                        value={city} onChange={e => setCity(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Game Utama *</label>
                  <select className="form-input" value={esportType} onChange={e => setEsportType(e.target.value)} required>
                    <option value="">Pilih game...</option>
                    {ESPORT_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </>
            )}

            {!isPlayer && (
              <div>
                <label className="form-label">Nama *</label>
                <input className="form-input" placeholder="Nama lengkap" maxLength={100}
                  value={staffName} onChange={e => setStaffName(e.target.value)} required />
              </div>
            )}

            {rateLimitSecs > 0 && <RateLimitCountdown seconds={rateLimitSecs} onDone={() => setRateLimitSecs(0)} />}
            {error && (
              <p style={{ fontSize:12, color:'var(--red)', background:'rgba(225,29,72,0.1)', borderRadius:7, padding:'8px 12px', display:'flex', alignItems:'flex-start', gap:6 }}>
                <AlertTriangle size={13} style={{ flexShrink:0, marginTop:1 }} />{error}
              </p>
            )}

            <button type="submit" className="btn btn-primary"
              disabled={submitting || rateLimitSecs > 0}
              style={{ width:'100%', justifyContent:'center', marginTop:4 }}>
              {submitting ? 'Mendaftarkan...' : `Daftar sebagai ${ROLE_LABEL[tokenData?.role] || 'Member'}`}
            </button>

            {isManager && <p style={{ fontSize:11, color:'var(--text-dim)', textAlign:'center' }}>Akun Team Manager perlu diverifikasi oleh Super Admin.</p>}
            {isPlayer  && <p style={{ fontSize:11, color:'var(--green)', textAlign:'center' }}>✓ Akun player via link undangan langsung aktif.</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
