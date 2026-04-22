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

      if (error || !data)                        { setTokenStatus('invalid'); return }
      if (data.used_at)                          { setTokenStatus('used');    return }
      if (new Date(data.expires_at) < new Date()) { setTokenStatus('expired'); return }

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

      // ── Step 1: Create Supabase auth user ──────────────────
      const { data: authData, error: signupErr } = await supabase.auth.signUp({ email, password })
      if (signupErr) throw new Error(signupErr.message)

      const userId = authData.user?.id
      if (!userId) throw new Error('Gagal membuat akun. Coba lagi.')

      // ── Step 2: Call SECURITY DEFINER RPC ─────────────────
      // This bypasses RLS and handles: users upsert + player_application + token used
      const { error: rpcErr } = await supabase.rpc('register_invite_user', {
        p_user_id:         userId,
        p_email:           email,
        p_name:            isPlayer ? fullName : staffName,
        p_role:            tokenData.role,
        p_team_id:         tokenData.team_id,
        p_is_active:       false,  // always false — needs approval/activation
        p_ign:             isPlayer ? nickname : null,
        p_invite_token_id: tokenData.id,
        // player-only
        p_nickname:        isPlayer ? nickname    : null,
        p_full_name:       isPlayer ? fullName    : null,
        p_birth_place:     isPlayer ? birthPlace  : null,
        p_birth_date:      isPlayer ? birthDate   : null,
        p_address:         isPlayer ? address     : null,
        p_domicile:        isPlayer ? domicile    : null,
        p_esport_type:     isPlayer ? esportType  : null,
      })

      if (rpcErr) throw new Error(rpcErr.message)

      // ── Step 3: Sign out — login only after approval ───────
      await supabase.auth.signOut()
      setStep(2)

    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const bg     = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'var(--bg-base)', position:'relative', overflow:'hidden' }
  const gridBg = { position:'fixed', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize:'48px 48px' }
  const glow   = { position:'fixed', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(225,29,72,0.06) 0%,transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }
  const card   = { width:'100%', maxWidth:480, position:'relative', zIndex:10, background:'#0f1020', border:'1px solid var(--border-1)', borderRadius:16, padding:'28px', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }

  // ── STATUS SCREENS ──────────────────────────────────────────
  if (tokenStatus === 'loading') {
    return (
      <div style={bg}><div style={gridBg}/><div style={glow}/>
        <div style={{ ...card, textAlign:'center', padding:48 }}>
          <Loader size={32} style={{ color:'var(--red)', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Memvalidasi link undangan...</p>
        </div>
      </div>
    )
  }

  if (tokenStatus !== 'valid' || !tokenData) {
    const msgs = {
      expired: { icon: AlertTriangle, title:'Link Kedaluwarsa',     sub:'Link undangan ini sudah tidak berlaku (>24 jam). Hubungi team manager untuk mendapatkan link baru.' },
      used:    { icon: CheckCircle,   title:'Link Sudah Digunakan', sub:'Link undangan ini sudah dipakai. Jika ini bukan kamu, hubungi administrator.' },
      invalid: { icon: XCircle,       title:'Link Tidak Valid',     sub:'Link undangan tidak ditemukan atau telah dihapus.' },
    }
    const { icon: Icon, title, sub } = msgs[tokenStatus] || msgs.invalid
    return (
      <div style={bg}><div style={gridBg}/><div style={glow}/>
        <div style={{ ...card, textAlign:'center' }}>
          <div style={{ marginBottom:24 }}><NXKLogo size={56}/></div>
          <Icon size={40} style={{ color: tokenStatus === 'used' ? '#22c55e' : 'var(--red)', margin:'0 auto 16px' }} />
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{title}</p>
          <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{sub}</p>
        </div>
      </div>
    )
  }

  // ── SUCCESS SCREEN ─────────────────────────────────────────
  if (step === 2) {
    const isPlayer = tokenData.role === 'player'
    return (
      <div style={bg}><div style={gridBg}/><div style={glow}/>
        <div style={{ ...card, textAlign:'center' }}>
          <div style={{ marginBottom:24 }}><NXKLogo size={64}/></div>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <CheckCircle size={28} style={{ color:'#22c55e' }} />
          </div>
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>
            Pendaftaran Berhasil!
          </p>
          {isPlayer ? (
            <>
              <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:16 }}>
                Pendaftaranmu ke <strong style={{ color:'var(--text-primary)' }}>{teamName}</strong> sudah diterima.
              </p>
              <div style={{ background:'rgba(251,163,21,0.07)', border:'1px solid rgba(251,163,21,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, textAlign:'left' }}>
                <p style={{ fontSize:12, color:'#fbbf24', lineHeight:1.7 }}>
                  <strong>Langkah selanjutnya:</strong><br/>
                  1. Cek email &amp; klik link verifikasi dari Supabase (cek folder spam).<br/>
                  2. Tunggu Team Manager mengapprove pendaftaranmu.<br/>
                  3. Setelah diapprove, kamu bisa login.
                </p>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:16 }}>
                Akunmu sebagai <strong style={{ color:'var(--text-primary)' }}>{ROLE_LABEL[tokenData.role]}</strong> di{' '}
                <strong style={{ color:'var(--text-primary)' }}>{teamName}</strong> sudah terdaftar.
              </p>
              <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:20, textAlign:'left' }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <Mail size={14} style={{ color:'#60a5fa', flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12, color:'#60a5fa', lineHeight:1.7 }}>
                    <strong>Langkah selanjutnya:</strong><br/>
                    1. Cek email &amp; klik link verifikasi dari Supabase (cek spam).<br/>
                    2. Super Admin akan mengaktivasi akunmu di halaman Approvals.<br/>
                    3. Setelah diaktivasi, kamu bisa login ke dashboard.
                  </p>
                </div>
              </div>
            </>
          )}
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'10px' }}
            onClick={() => navigate('/login')}>
            Ke Halaman Login
          </button>
        </div>
      </div>
    )
  }

  const isPlayer = tokenData.role === 'player'

  // ── REGISTRATION FORM ─────────────────────────────────────
  return (
    <div style={bg}><div style={gridBg}/><div style={glow}/>
      <div style={{ width:'100%', maxWidth:520, position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
          <NXKLogo size={56}/>
          <div style={{ marginTop:16, textAlign:'center' }}>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:600, letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:4 }}>UNDANGAN BERGABUNG</p>
            <p style={{ fontSize:13, color:'var(--text-primary)' }}>
              <span style={{ color:'var(--red)', fontWeight:600 }}>{teamName}</span>
              {' · '}
              <span className="badge badge-ocean" style={{ fontSize:11 }}>{ROLE_LABEL[tokenData.role]}</span>
            </p>
            <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>
              Link berlaku hingga {new Date(tokenData.expires_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div style={card}>
          <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:20 }}>
            Buat Akun {ROLE_LABEL[tokenData.role]}
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <label className="form-label">Email</label>
                <input type="email" required className="form-input" placeholder="email@kamu.com"
                  value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPw?'text':'password'} required className="form-input"
                    placeholder="Min. 8 karakter" value={password} onChange={e=>setPassword(e.target.value)}
                    style={{ paddingRight:38 }} />
                  <button type="button" onClick={()=>setShowPw(v=>!v)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2 }}>
                    {showPw ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Konfirmasi Password</label>
                <input type={showPw?'text':'password'} required className="form-input"
                  placeholder="Ulangi password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
              </div>
            </div>

            <div style={{ borderTop:'1px solid var(--border-1)', paddingTop:14 }}>
              <p style={{ fontSize:11, fontFamily:'Syne,sans-serif', fontWeight:600, letterSpacing:'0.1em', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:14 }}>
                {isPlayer ? 'Data Pendaftaran Player' : 'Informasi Pribadi'}
              </p>
            </div>

            {isPlayer ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label className="form-label">Nickname / IGN <span style={{ color:'var(--red)' }}>*</span></label>
                    <input required className="form-input" placeholder="Username in-game"
                      value={nickname} onChange={e=>setNickname(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Nama Asli <span style={{ color:'var(--red)' }}>*</span></label>
                    <input required className="form-input" placeholder="Nama lengkap sesuai KTP"
                      value={fullName} onChange={e=>setFullName(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Tempat Lahir <span style={{ color:'var(--red)' }}>*</span></label>
                    <input required className="form-input" placeholder="Kota tempat lahir"
                      value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Lahir <span style={{ color:'var(--red)' }}>*</span></label>
                    <input type="date" required className="form-input"
                      value={birthDate} onChange={e=>setBirthDate(e.target.value)} />
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label className="form-label">Alamat <span style={{ color:'var(--red)' }}>*</span></label>
                    <input required className="form-input" placeholder="Alamat lengkap sesuai KTP"
                      value={address} onChange={e=>setAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Domisili <span style={{ color:'var(--red)' }}>*</span></label>
                    <input required className="form-input" placeholder="Kota domisili saat ini"
                      value={domicile} onChange={e=>setDomicile(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Jenis Esport <span style={{ color:'var(--red)' }}>*</span></label>
                    <select required className="form-input" value={esportType} onChange={e=>setEsportType(e.target.value)}>
                      <option value="">Pilih game...</option>
                      {ESPORT_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ background:'rgba(251,163,21,0.07)', border:'1px solid rgba(251,163,21,0.2)', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#fbbf24', lineHeight:1.5 }}>
                    ⏳ Setelah daftar, verifikasi email kamu lalu tunggu approval dari management tim.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="form-label">Nama Lengkap <span style={{ color:'var(--red)' }}>*</span></label>
                  <input required className="form-input" placeholder="Nama kamu"
                    value={staffName} onChange={e=>setStaffName(e.target.value)} />
                </div>
                <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <Mail size={13} style={{ color:'#60a5fa', flexShrink:0, marginTop:1 }}/>
                    <p style={{ fontSize:11, color:'#60a5fa', lineHeight:1.5 }}>
                      Setelah daftar, verifikasi email kamu lalu tunggu Super Admin mengaktivasi akunmu.
                    </p>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{ background:'var(--red-bg)', border:'1px solid rgba(225,29,72,0.25)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'var(--red)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'11px', marginTop:4, fontFamily:'Syne,sans-serif', letterSpacing:'0.04em' }}>
              {submitting ? 'Mendaftar...' : `Daftar sebagai ${ROLE_LABEL[tokenData.role]}`}
            </button>
          </form>
        </div>

        <p style={{ fontSize:10, textAlign:'center', marginTop:14, color:'var(--text-dim)', letterSpacing:'0.05em' }}>
          NXK ESPORTS · MANAGEMENT SYSTEM v2
        </p>
      </div>
    </div>
  )
}