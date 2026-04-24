import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Link2, Plus, Copy, Trash2, RefreshCw, Clock, CheckCircle, XCircle, User } from 'lucide-react'

function formatExpiry(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffH = Math.round((d - now) / 3600000)
  if (diffH < 0)   return 'Kedaluwarsa'
  if (diffH < 1)   return '< 1 jam lagi'
  if (diffH < 24)  return `${diffH} jam lagi`
  return d.toLocaleDateString('id-ID')
}

function StatusBadge({ token }) {
  if (token.used_at)                              return <span className="badge badge-green"><CheckCircle size={10}/> Digunakan</span>
  if (new Date(token.expires_at) < new Date())   return <span className="badge badge-slate"><XCircle size={10}/> Kedaluwarsa</span>
  return <span className="badge badge-ocean"><Clock size={10}/> Aktif</span>
}

export default function TmInvitePage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [tokens, setTokens]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [note, setNote]           = useState('')
  const [creating, setCreating]   = useState(false)
  const [myTeamId, setMyTeamId]   = useState(null)

  const fetchTokens = useCallback(async (teamId) => {
    if (!teamId) return
    setLoading(true)
    // FIX BUG #4: filter by team_id agar TM hanya lihat token tim sendiri
    const { data } = await supabase
      .from('invite_tokens')
      .select('*, teams(name), users!invite_tokens_used_by_fkey(name)')
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
    })
    setCreating(false)
    if (error) { addToast({ message: 'Gagal membuat link: ' + error.message, type: 'danger' }); return }
    addToast({ message: 'Link undangan berhasil dibuat.', type: 'success' })
    setNote('')
    setShowModal(false)
    fetchTokens()
  }

  async function deleteToken(id) {
    const { error } = await supabase.from('invite_tokens').delete().eq('id', id)
    if (!error) {
      setTokens(prev => prev.filter(t => t.id !== id))
      addToast({ message: 'Link dihapus.', type: 'success' })
    }
  }

  function copyLink(token) {
    const url = `${window.location.origin}/register/${token}`
    navigator.clipboard.writeText(url)
    addToast({ message: 'Link disalin ke clipboard!', type: 'success' })
  }

  const active   = tokens.filter(t => !t.used_at && new Date(t.expires_at) > new Date())
  const used     = tokens.filter(t => t.used_at)
  const expired  = tokens.filter(t => !t.used_at && new Date(t.expires_at) <= new Date())

  return (
    <DashboardLayout title="Invite Players">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
          Link Undangan Player
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Buat link personal untuk mengundang player bergabung ke tim. Setiap link berlaku 24 jam.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Aktif', count: active.length,   color: '#38bdf8' },
          { label: 'Digunakan', count: used.length,   color: '#22c55e' },
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
              const isActive  = !t.used_at && new Date(t.expires_at) > new Date()
              const link      = `${window.location.origin}/register/${t.token}`
              return (
                <div key={t.id} style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isActive ? 'var(--border-2)' : 'var(--border-1)'}`,
                  borderRadius: 10, padding: '12px 14px',
                  opacity: isActive ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <StatusBadge token={t} />
                        {t.note && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {t.note}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {link}
                      </p>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          <Clock size={10} style={{ marginRight: 4 }} />
                          {formatExpiry(t.expires_at)}
                        </span>
                        {t.used_at && t['users'] && (
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            <User size={10} style={{ marginRight: 4 }} />
                            {t['users'].name || 'Unknown'}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {new Date(t.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {isActive && (
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
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Link akan berlaku selama 24 jam dan hanya bisa digunakan sekali. Player yang mendaftar via link ini perlu diapprove oleh management sebelum bisa login.
        </p>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Label / Catatan (Opsional)</label>
          <input className="form-input" placeholder="Contoh: Untuk posisi Jungler"
            value={note} onChange={e => setNote(e.target.value)} />
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            Label membantu kamu mengidentifikasi untuk siapa link ini dibuat.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
          <button className="btn btn-primary" disabled={creating} onClick={createToken}>
            {creating ? 'Membuat...' : 'Buat Link'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
