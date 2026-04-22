import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, Filter, User, MapPin, Calendar, Gamepad2 } from 'lucide-react'

const STATUS_CONFIG = {
  pending:  { label: 'Menunggu',  badge: 'badge-amber', icon: Clock },
  approved: { label: 'Approved',  badge: 'badge-green', icon: CheckCircle },
  rejected: { label: 'Ditolak',   badge: 'badge-red',   icon: XCircle },
}

function AppCard({ app, onReview }) {
  const cfg = STATUS_CONFIG[app.status]
  const Icon = cfg.icon
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Color accent top bar */}
      <div style={{
        height: 3,
        background: app.status === 'approved' ? '#22c55e' : app.status === 'rejected' ? 'var(--red)' : 'linear-gradient(90deg,#f59e0b,#fb923c)',
      }} />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--brand-glow)', border: '1px solid rgba(225,29,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {app.nickname}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.full_name}</p>
            </div>
          </div>
          <span className={`badge ${cfg.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon size={10} /> {cfg.label}
          </span>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {app.birth_place}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.domicile}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gamepad2 size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.esport_type}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(app.created_at).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>

        {app.teams && (
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
            Tim: <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{app.teams.name}</span>
          </p>
        )}

        {app.review_notes && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Catatan: {app.review_notes}
            </p>
          </div>
        )}

        {app.status === 'pending' && (
          <button className="btn" style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 12 }}
            onClick={() => onReview(app)}>
            <Eye size={12} /> Review Pendaftaran
          </button>
        )}
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const { user, role } = useAuth()
  const { addToast }   = useToast()

  const [apps, setApps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes]       = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchApps = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('player_applications').select('*, teams(name), users!player_applications_reviewed_by_fkey(name)')
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q.order('created_at', { ascending: false })
    setApps(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function handleApprove() {
    setProcessing(true)
    const { error } = await supabase.rpc('approve_player_application', {
      app_id:      selected.id,
      reviewer_id: user.id,
      notes:       notes || null,
    })
    setProcessing(false)
    if (error) { addToast({ message: 'Gagal approve: ' + error.message, type: 'danger' }); return }
    addToast({ message: `${selected.nickname} berhasil di-approve!`, type: 'success' })
    setSelected(null); setNotes(''); fetchApps()
  }

  async function handleReject() {
    setProcessing(true)
    const { error } = await supabase.rpc('reject_player_application', {
      app_id:      selected.id,
      reviewer_id: user.id,
      notes:       notes || null,
    })
    setProcessing(false)
    if (error) { addToast({ message: 'Gagal reject: ' + error.message, type: 'danger' }); return }
    addToast({ message: `Pendaftaran ${selected.nickname} ditolak.`, type: 'success' })
    setSelected(null); setNotes(''); fetchApps()
  }

  const pendingCount = apps.filter(a => a.status === 'pending').length

  return (
    <DashboardLayout title="Approvals">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
            Approval Pendaftaran Player
            {pendingCount > 0 && (
              <span style={{ background: 'var(--red)', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 7px', fontFamily: 'Syne,sans-serif' }}>
                {pendingCount}
              </span>
            )}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Review dan approve/tolak pendaftaran player yang masuk via link undangan.
          </p>
        </div>
        <button className="btn" style={{ padding: '6px 10px' }} onClick={fetchApps}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'pending',  label: 'Menunggu' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Ditolak' },
          { key: 'all',      label: 'Semua' },
        ].map(f => (
          <button key={f.key}
            className={`btn${filter === f.key ? ' btn-primary' : ''}`}
            style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0', fontSize: 12 }}>Memuat...</p>
      ) : apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle size={36} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filter === 'pending' ? 'Tidak ada pendaftaran yang menunggu review.' : 'Tidak ada data.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {apps.map(app => (
            <AppCard key={app.id} app={app} onReview={a => { setSelected(a); setNotes('') }} />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Pendaftaran Player">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Player detail */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '14px', border: '1px solid var(--border-1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Nickname', selected.nickname],
                  ['Nama Asli', selected.full_name],
                  ['Tempat Lahir', selected.birth_place],
                  ['Tanggal Lahir', selected.birth_date ? new Date(selected.birth_date).toLocaleDateString('id-ID') : '—'],
                  ['Alamat', selected.address],
                  ['Domisili', selected.domicile],
                  ['Jenis Esport', selected.esport_type],
                  ['Tim', selected.teams?.name || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Catatan (Opsional)</label>
              <input className="form-input" placeholder="Tambahkan catatan untuk player ini..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                disabled={processing} onClick={handleReject}>
                <XCircle size={14} /> Tolak
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }}
                disabled={processing} onClick={handleApprove}>
                <CheckCircle size={14} /> {processing ? 'Memproses...' : 'Approve'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
