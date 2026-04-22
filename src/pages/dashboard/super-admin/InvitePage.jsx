import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Link2, Plus, Copy, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Shield, UserCog } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'team_manager', label: 'Team Manager', badge: 'badge-ocean', icon: UserCog },
  { value: 'staff',        label: 'Staff',        badge: 'badge-amber', icon: Shield },
]

function formatExpiry(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffH = Math.round((d - now) / 3600000)
  if (diffH < 0)  return 'Kedaluwarsa'
  if (diffH < 1)  return '< 1 jam lagi'
  if (diffH < 24) return `${diffH} jam lagi`
  return d.toLocaleDateString('id-ID')
}

function StatusBadge({ token }) {
  if (token.used_at)                            return <span className="badge badge-green"><CheckCircle size={10}/> Digunakan</span>
  if (new Date(token.expires_at) < new Date())  return <span className="badge badge-slate"><XCircle size={10}/> Kedaluwarsa</span>
  return <span className="badge badge-ocean"><Clock size={10}/> Aktif</span>
}

export default function SAInvitePage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [tokens, setTokens]     = useState([])
  const [teams, setTeams]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [selRole, setSelRole]   = useState('team_manager')
  const [selTeam, setSelTeam]   = useState('')
  const [note, setNote]         = useState('')

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('invite_tokens')
      .select('*, teams(name), users!invite_tokens_used_by_fkey(name)')
      .in('role', ['team_manager', 'staff'])
      .order('created_at', { ascending: false })
    setTokens(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTokens()
    supabase.from('teams').select('id,name').eq('is_active', true).order('name')
      .then(({ data }) => setTeams(data || []))
  }, [fetchTokens])

  async function createToken() {
    if (!selTeam) { addToast({ message: 'Pilih tim terlebih dahulu.', type: 'danger' }); return }
    setCreating(true)
    const { error } = await supabase.from('invite_tokens').insert({
      role:       selRole,
      team_id:    selTeam,
      created_by: user.id,
      note:       note || null,
    })
    setCreating(false)
    if (error) { addToast({ message: 'Gagal membuat link: ' + error.message, type: 'danger' }); return }
    addToast({ message: 'Link undangan berhasil dibuat.', type: 'success' })
    setNote('')
    setSelTeam('')
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

  const ROLE_BADGE = { team_manager: 'badge-ocean', staff: 'badge-amber' }
  const ROLE_LABEL = { team_manager: 'Team Manager', staff: 'Staff' }

  return (
    <DashboardLayout title="Invite Staff & Manager">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
          Link Undangan Staff & Manager
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Generate link personal untuk mengundang Team Manager atau Staff bergabung ke sistem. Berlaku 24 jam, langsung aktif setelah registrasi.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Manager Diundang', count: tokens.filter(t => t.role === 'team_manager' && t.used_at).length, color: '#38bdf8' },
          { label: 'Staff Diundang',   count: tokens.filter(t => t.role === 'staff' && t.used_at).length, color: '#f59e0b' },
          { label: 'Aktif Pending',    count: tokens.filter(t => !t.used_at && new Date(t.expires_at) > new Date()).length, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px 16px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne,sans-serif', color: s.color }}>{s.count}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Semua Link ({tokens.length})
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ padding: '6px 10px' }} onClick={fetchTokens}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', gap: 6 }} onClick={() => setShowModal(true)}>
              <Plus size={13} /> Buat Link
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
              const isActive = !t.used_at && new Date(t.expires_at) > new Date()
              const link     = `${window.location.origin}/register/${t.token}`
              return (
                <div key={t.id} style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${isActive ? 'var(--border-2)' : 'var(--border-1)'}`,
                  borderRadius: 10, padding: '12px 14px', opacity: isActive ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <StatusBadge token={t} />
                        <span className={`badge ${ROLE_BADGE[t.role]}`}>{ROLE_LABEL[t.role]}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.teams?.name}</span>
                        {t.note && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>{t.note}</span>}
                      </div>
                      <p style={{ fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {link}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        <Clock size={10} style={{ marginRight: 4 }} />
                        {formatExpiry(t.expires_at)}
                        {t.used_at && t['users'] && ` · Digunakan oleh ${t['users'].name || 'Unknown'}`}
                      </p>
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat Link Undangan Staff/Manager">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Role</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {ROLE_OPTIONS.map(r => (
                <button key={r.value} type="button"
                  onClick={() => setSelRole(r.value)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${selRole === r.value ? 'rgba(225,29,72,0.5)' : 'var(--border-1)'}`,
                    background: selRole === r.value ? 'var(--brand-glow)' : 'var(--bg-surface)',
                    color: selRole === r.value ? 'var(--red)' : 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Tim</label>
            <select className="form-input" value={selTeam} onChange={e => setSelTeam(e.target.value)} required>
              <option value="">Pilih tim...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Label / Catatan (Opsional)</label>
            <input className="form-input" placeholder="Contoh: Manager untuk tim MLBB A"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-1)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              ✅ Akun {selRole === 'team_manager' ? 'Team Manager' : 'Staff'} akan langsung aktif setelah registrasi. Tidak perlu approval.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" disabled={creating || !selTeam} onClick={createToken}>
              {creating ? 'Membuat...' : 'Buat Link'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
