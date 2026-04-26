import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Link2, Plus, Copy, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Users, Infinity } from 'lucide-react'

function formatExpiry(dateStr) {
  const d   = new Date(dateStr)
  const now = new Date()
  const diffH = Math.round((d - now) / 3600000)
  if (diffH < 0)   return 'Kedaluwarsa'
  if (diffH < 1)   return '< 1 jam lagi'
  if (diffH < 24)  return `${diffH} jam lagi`
  return d.toLocaleDateString('id-ID')
}

function StatusBadge({ token }) {
  const expired = new Date(token.expires_at) < new Date()
  if (expired) return (
    <span className="badge badge-slate"><XCircle size={10} /> Kedaluwarsa</span>
  )
  return (
    <span className="badge badge-ocean"><Clock size={10} /> Aktif</span>
  )
}

function UsageBadge({ token }) {
  const count   = token.use_count ?? 0
  const max     = token.max_uses
  const expired = new Date(token.expires_at) < new Date()
  if (expired && count === 0) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, color: 'var(--text-muted)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-1)',
      borderRadius: 6, padding: '2px 6px',
    }}>
      <Users size={9} />
      {count} / {max == null ? <Infinity size={9} /> : max}
    </span>
  )
}

export default function TmInvitePage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [tokens, setTokens]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [note, setNote]           = useState('')
  const [maxUses, setMaxUses]     = useState('')   // '' = unlimited
  const [creating, setCreating]   = useState(false)
  const [myTeamId, setMyTeamId]   = useState(null)

  const fetchTokens = useCallback(async (teamId) => {
    if (!teamId) return
    setLoading(true)
    const { data } = await supabase
      .from('invite_tokens')
      .select('*, teams(name)')
      .eq('role', 'player')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    setTokens(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const { data: me } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      const tid = me?.team_id
      setMyTeamId(tid)
      fetchTokens(tid)
    }
    if (user) init()
  }, [user, fetchTokens])

  async function createToken() {
    if (!myTeamId) { addToast({ message: 'Kamu belum terhubung ke tim.', type: 'danger' }); return }
    setCreating(true)
    const { error } = await supabase.from('invite_tokens').insert({
      role:       'player',
      team_id:    myTeamId,
      created_by: user.id,
      note:       note || null,
      max_uses:   maxUses ? parseInt(maxUses) : null,  // null = unlimited dalam 24 jam
      use_count:  0,
    })
    setCreating(false)
    if (error) { addToast({ message: 'Gagal membuat link: ' + error.message, type: 'danger' }); return }
    addToast({ message: 'Link undangan berhasil dibuat.', type: 'success' })
    setNote('')
    setMaxUses('')
    setShowModal(false)
    fetchTokens(myTeamId)
  }

  async function deleteToken(id) {
    // Gunakan .select() agar Supabase return baris yang terhapus.
    // Tanpa .select(), RLS silent block return { data: null, error: null }
    // sehingga kode salah anggap sukses -> UI update tapi DB tidak berubah
    // -> item muncul lagi saat refresh.
    const { data, error } = await supabase
      .from('invite_tokens')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      console.error('[deleteToken] error:', error)
      addToast({ message: 'Gagal menghapus link: ' + error.message, type: 'danger' })
      return
    }

    // data kosong = RLS diam-diam blokir, tidak ada baris yang terhapus
    if (!data || data.length === 0) {
      console.warn('[deleteToken] 0 rows deleted — kemungkinan RLS block')
      addToast({ message: 'Link tidak bisa dihapus. Hubungi administrator.', type: 'danger' })
      return
    }

    // Baru update state kalau DB benar-benar berhasil hapus
    setTokens(prev => prev.filter(t => t.id !== id))
    addToast({ message: 'Link dihapus.', type: 'success' })
  }

  function copyLink(token) {
    const url = `${window.location.origin}/register/${token}`
    navigator.clipboard.writeText(url)
    addToast({ message: 'Link disalin ke clipboard!', type: 'success' })
  }

  // Sebuah token aktif jika: belum expire DAN (max_uses null ATAU use_count < max_uses)
  function isActive(t) {
    if (new Date(t.expires_at) < new Date()) return false
    if (t.max_uses != null && (t.use_count ?? 0) >= t.max_uses) return false
    return true
  }

  const active  = tokens.filter(t =>  isActive(t))
  const full    = tokens.filter(t => !isActive(t) && new Date(t.expires_at) > new Date())
  const expired = tokens.filter(t =>  new Date(t.expires_at) < new Date())

  return (
    <DashboardLayout title="Invite Players">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
          Link Undangan Player
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Buat link untuk mengundang player bergabung ke tim. Satu link bisa dipakai <strong style={{ color: 'var(--text-secondary)' }}>banyak orang</strong> selama <strong style={{ color: 'var(--text-secondary)' }}>24 jam</strong>.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Aktif',        count: active.length,  color: '#38bdf8' },
          { label: 'Penuh / Full', count: full.length,    color: '#f59e0b' },
          { label: 'Kedaluwarsa', count: expired.length, color: 'var(--text-dim)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 16px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: s.color }}>{s.count}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Semua Link ({tokens.length})
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ padding: '6px 10px' }} onClick={() => fetchTokens(myTeamId)}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', gap: 6 }} onClick={() => setShowModal(true)}>
              <Plus size={13} /> Buat Link Baru
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontSize: 12 }}>Memuat...</p>
        ) : tokens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Link2 size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada link undangan dibuat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tokens.map(t => {
              const active_ = isActive(t)
              const link    = `${window.location.origin}/register/${t.token}`
              return (
                <div key={t.id} style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${active_ ? 'var(--border-2)' : 'var(--border-1)'}`,
                  borderRadius: 10, padding: '12px 14px',
                  opacity: active_ ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <StatusBadge token={t} />
                        <UsageBadge token={t} />
                        {t.note && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.note}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {link}
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {formatExpiry(t.expires_at)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {(t.use_count ?? 0)} orang sudah daftar
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {new Date(t.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {active_ && (
                        <button className="btn" style={{ fontSize: 11, padding: '5px 10px', gap: 5 }} onClick={() => copyLink(t.token)}>
                          <Copy size={11} /> Salin
                        </button>
                      )}
                      <button className="btn btn-danger" style={{ fontSize: 11, padding: '5px 8px' }} onClick={() => deleteToken(t.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat Link Undangan Player">
        <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#7dd3fc', lineHeight: 1.6 }}>
            🔗 Link berlaku <strong>24 jam</strong> dan bisa digunakan oleh <strong>banyak orang sekaligus</strong>. 
            Batasi jumlah pengguna dengan mengisi field "Maks. Pengguna" di bawah.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Label / Catatan (Opsional)</label>
            <input className="form-input" placeholder="Contoh: Rekrutmen Jungler batch April"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Maks. Pengguna (Opsional)</label>
            <input className="form-input" type="number" min="1" placeholder="Kosongkan = tidak terbatas"
              value={maxUses} onChange={e => setMaxUses(e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>
              Biarkan kosong jika ingin link bisa dipakai oleh siapapun selama 24 jam.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={creating} onClick={createToken}>
              {creating ? 'Membuat...' : 'Buat Link'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}