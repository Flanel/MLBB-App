// InvitePage.jsx — dengan setup batas waktu link yang fleksibel
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Link2, Plus, Copy, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Users, Shield, AlertTriangle } from 'lucide-react'

// Opsi durasi yang bisa dipilih manager
const DURATION_OPTIONS = [
  { label: '1 Jam',   hours: 1 },
  { label: '6 Jam',   hours: 6 },
  { label: '12 Jam',  hours: 12 },
  { label: '24 Jam',  hours: 24 },
  { label: '48 Jam',  hours: 48 },
  { label: '72 Jam',  hours: 72 },
  { label: '7 Hari',  hours: 168 },
]

const ROLE_OPTS = [
  { value: 'player',       label: 'Player',       desc: 'Langsung aktif setelah daftar' },
  { value: 'staff',        label: 'Staff',        desc: 'Langsung aktif setelah daftar' },
  { value: 'team_manager', label: 'Team Manager', desc: 'Butuh approval Super Admin' },
]

function formatExpiry(dateStr) {
  const d    = new Date(dateStr)
  const now  = new Date()
  const diffH = Math.round((d - now) / 3600000)
  if (diffH < 0)   return 'Kedaluwarsa'
  if (diffH < 1)   return '< 1 jam lagi'
  if (diffH < 24)  return `${diffH} jam lagi`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} hari lagi`
}

function isActive(t) {
  if (new Date(t.expires_at) < new Date()) return false
  if (t.max_uses != null && (t.use_count ?? 0) >= t.max_uses) return false
  return true
}

export default function TmInvitePage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [tokens, setTokens]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [myTeamId, setMyTeamId]   = useState(null)
  const [creating, setCreating]   = useState(false)

  const [form, setForm] = useState({
    role:     'player',
    durationH: 24,
    maxUses:   '',
    note:      '',
  })

  const fetchTokens = useCallback(async (teamId) => {
    if (!teamId) return
    setLoading(true)
    const { data } = await supabase
      .from('invite_tokens')
      .select('*, teams(name)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    setTokens(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: me } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      setMyTeamId(me?.team_id)
      fetchTokens(me?.team_id)
    }
    if (user) init()
  }, [user, fetchTokens])

  async function createToken() {
    if (!myTeamId) { addToast({ message:'Belum terhubung ke tim.', type:'danger' }); return }
    setCreating(true)

    const expiresAt = new Date(Date.now() + form.durationH * 3600 * 1000).toISOString()

    const { error } = await supabase.from('invite_tokens').insert({
      role:       form.role,
      team_id:    myTeamId,
      created_by: user.id,
      note:       form.note || null,
      max_uses:   form.maxUses ? parseInt(form.maxUses) : null,
      use_count:  0,
      expires_at: expiresAt,
    })
    setCreating(false)
    if (error) { addToast({ message:'Gagal: ' + error.message, type:'danger' }); return }
    addToast({ message:`Link undangan (${ROLE_OPTS.find(r=>r.value===form.role)?.label}) berhasil dibuat!`, type:'success' })
    setForm({ role:'player', durationH:24, maxUses:'', note:'' })
    setShowModal(false)
    fetchTokens(myTeamId)
  }

  async function deleteToken(id) {
    const { data, error } = await supabase.from('invite_tokens').delete().eq('id', id).select('id')
    if (error || !data?.length) { addToast({ message:'Gagal menghapus.', type:'danger' }); return }
    setTokens(prev => prev.filter(t => t.id !== id))
    addToast({ message:'Link dihapus.', type:'success' })
  }

  function copyLink(token) {
    const url = `${window.location.origin}/register/${token}`
    navigator.clipboard.writeText(url)
    addToast({ message:'Link disalin!', type:'success' })
  }

  const activeTokens  = tokens.filter(t =>  isActive(t))
  const expiredTokens = tokens.filter(t => !isActive(t))

  const ROLE_COLOR = { player:'badge-green', staff:'badge-amber', team_manager:'badge-ocean' }

  return (
    <DashboardLayout title="Invite Players">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Undang Anggota</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Buat link undangan dengan batas waktu dan kuota untuk player, staff, atau manager.</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => setShowModal(true)}>
          <Plus size={13} /> Buat Link
        </button>
      </div>

      {/* Security info */}
      <div style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
        <Shield size={14} style={{ color:'#38bdf8', flexShrink:0, marginTop:1 }} />
        <div style={{ fontSize:12, color:'#38bdf8', lineHeight:1.6 }}>
          <strong>Keamanan Link:</strong> Setiap link unik (UUID), terenkripsi, dan otomatis kedaluwarsa sesuai durasi yang kamu set. Formulir pendaftaran dilindungi honeypot anti-bot + sanitasi input.
        </div>
      </div>

      {/* Active tokens */}
      {activeTokens.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
            Link Aktif ({activeTokens.length})
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {activeTokens.map(t => (
              <div key={t.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span className={`badge ${ROLE_COLOR[t.role] || 'badge-slate'}`} style={{ fontSize:10 }}>
                      {ROLE_OPTS.find(r=>r.value===t.role)?.label || t.role}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--amber)' }}>
                      <Clock size={10} /> {formatExpiry(t.expires_at)}
                    </span>
                    <span style={{ fontSize:10, color:'var(--text-dim)' }}>
                      {t.use_count ?? 0}/{t.max_uses ?? '∞'} dipakai
                    </span>
                    {t.note && <span style={{ fontSize:10, color:'var(--text-dim)', fontStyle:'italic' }}>"{t.note}"</span>}
                  </div>
                  <p style={{ fontSize:11, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {window.location.origin}/register/{t.token}
                  </p>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button className="btn" style={{ padding:'5px 10px', fontSize:11, gap:5 }} onClick={() => copyLink(t.token)}>
                    <Copy size={11} /> Salin
                  </button>
                  <button className="btn btn-danger" style={{ padding:'5px 8px' }} onClick={() => deleteToken(t.id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired/full tokens */}
      {expiredTokens.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
            Riwayat / Kedaluwarsa
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {expiredTokens.map(t => (
              <div key={t.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, opacity:0.55 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span className="badge badge-slate" style={{ fontSize:10 }}>
                      {ROLE_OPTS.find(r=>r.value===t.role)?.label || t.role}
                    </span>
                    <span style={{ fontSize:11, color:'var(--text-dim)' }}>
                      {new Date(t.expires_at) < new Date() ? 'Kedaluwarsa' : 'Penuh'} · {t.use_count ?? 0} dipakai
                    </span>
                  </div>
                </div>
                <button className="btn btn-danger" style={{ padding:'4px 7px' }} onClick={() => deleteToken(t.id)}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tokens.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:'48px 0' }}>
          <Link2 size={28} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }} />
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Belum ada link undangan.</p>
          <button className="btn btn-primary" style={{ margin:'0 auto', display:'flex', gap:6 }} onClick={() => setShowModal(true)}>
            <Plus size={12} /> Buat Link Pertama
          </button>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat Link Undangan" size="sm"
        footer={<>
          <Button onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" onClick={createToken} disabled={creating}>
            {creating ? 'Membuat...' : 'Buat Link'}
          </Button>
        </>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Role */}
          <div>
            <label className="form-label">Role Undangan *</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {ROLE_OPTS.map(r => (
                <label key={r.value} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:`1px solid ${form.role===r.value?'rgba(225,29,72,0.4)':'var(--border-1)'}`, background: form.role===r.value?'var(--brand-glow)':'var(--bg-elevated)', cursor:'pointer' }}>
                  <input type="radio" name="role" value={r.value} checked={form.role===r.value} onChange={() => setForm(f=>({...f,role:r.value}))} style={{ accentColor:'var(--brand)' }} />
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.label}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)' }}>{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Durasi */}
          <div>
            <label className="form-label">Batas Waktu *</label>
            <select className="form-input" value={form.durationH} onChange={e => setForm(f=>({...f,durationH:parseInt(e.target.value)}))}>
              {DURATION_OPTIONS.map(o => (
                <option key={o.hours} value={o.hours}>{o.label}</option>
              ))}
            </select>
            <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>Link otomatis kedaluwarsa setelah durasi ini.</p>
          </div>

          {/* Max uses */}
          <div>
            <label className="form-label">Maks. Penggunaan (kosong = unlimited)</label>
            <input className="form-input" type="number" min="1" placeholder="e.g. 5"
              value={form.maxUses} onChange={e => setForm(f=>({...f,maxUses:e.target.value}))} />
          </div>

          {/* Note */}
          <div>
            <label className="form-label">Catatan (opsional)</label>
            <input className="form-input" placeholder="e.g. Rekrutmen Season 3"
              value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} maxLength={80} />
          </div>

          {form.role === 'team_manager' && (
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-start' }}>
              <AlertTriangle size={13} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:11, color:'#f59e0b' }}>Akun Team Manager yang daftar via link ini akan butuh approval dari Super Admin sebelum bisa login.</p>
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  )
}
