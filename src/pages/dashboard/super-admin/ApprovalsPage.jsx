import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  CheckCircle, XCircle, Clock, Eye, RefreshCw,
  User, MapPin, Calendar, Gamepad2, UserCog, Shield,
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:  { label: 'Menunggu', badge: 'badge-amber', icon: Clock },
  approved: { label: 'Approved', badge: 'badge-green', icon: CheckCircle },
  rejected: { label: 'Ditolak',  badge: 'badge-red',   icon: XCircle },
}

const ROLE_LABEL = { staff: 'Staff', team_manager: 'Team Manager' }

// ── Player Application Card ──────────────────────────────────────────────────
function AppCard({ app, onReview }) {
  const cfg  = STATUS_CONFIG[app.status]
  const Icon = cfg.icon
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ height:3, background: app.status === 'approved' ? '#22c55e' : app.status === 'rejected' ? 'var(--red)' : 'linear-gradient(90deg,#f59e0b,#fb923c)' }} />
      <div style={{ padding:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--brand-glow)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={18} style={{ color:'var(--red)' }}/>
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{app.nickname}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{app.full_name}</p>
            </div>
          </div>
          <span className={`badge ${cfg.badge}`} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Icon size={10}/> {cfg.label}
          </span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Calendar size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>
              {app.birth_place}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <MapPin size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{app.domicile}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Gamepad2 size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{app.esport_type}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(app.created_at).toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        {app.teams && (
          <p style={{ fontSize:11, color:'var(--text-dim)', marginBottom:10 }}>
            Tim: <span style={{ color:'var(--text-muted)', fontWeight:500 }}>{app.teams.name}</span>
          </p>
        )}

        {app.review_notes && (
          <div style={{ background:'var(--bg-surface)', borderRadius:6, padding:'8px 10px', marginBottom:10 }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>Catatan: {app.review_notes}</p>
          </div>
        )}

        {app.status === 'pending' && (
          <button className="btn" style={{ width:'100%', justifyContent:'center', gap:6, fontSize:12 }}
            onClick={() => onReview(app)}>
            <Eye size={12}/> Review Pendaftaran
          </button>
        )}
      </div>
    </div>
  )
}

// ── Staff/Manager Pending Card ───────────────────────────────────────────────
function StaffCard({ u, onActivate }) {
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
      <div style={{ padding:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <UserCog size={18} style={{ color:'#60a5fa' }}/>
            </div>
            <div>
              <p style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>
                {u.name || '(nama belum diisi)'}
              </p>
              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email}</p>
            </div>
          </div>
          <span className="badge badge-ocean" style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Shield size={10}/> {ROLE_LABEL[u.role] || u.role}
          </span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:12 }}>
          {u.teams && (
            <div style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:6 }}>
              <Shield size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>Tim: <strong style={{ color:'var(--text-primary)' }}>{u.teams.name}</strong></span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Clock size={11} style={{ color:'var(--text-dim)', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>
              Daftar: {new Date(u.created_at).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>

        <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:6, padding:'7px 10px', marginBottom:12 }}>
          <p style={{ fontSize:11, color:'#60a5fa' }}>
            Menunggu verifikasi & aktivasi dari Super Admin
          </p>
        </div>

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', gap:6, fontSize:12 }}
          onClick={() => onActivate(u)}>
          <CheckCircle size={12}/> Aktifkan Akun
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const { user }   = useAuth()
  const { addToast } = useToast()

  // Tab: 'players' | 'staff'
  const [tab, setTab] = useState('players')

  // Player application state
  const [apps,    setApps]    = useState([])
  const [appFilter, setAppFilter] = useState('pending')
  const [selected, setSelected]   = useState(null)
  const [notes,    setNotes]       = useState('')
  const [processing, setProcessing] = useState(false)

  // Staff/Manager pending state
  const [pendingStaff, setPendingStaff]   = useState([])
  const [staffLoading, setStaffLoading]   = useState(true)
  const [activateTarget, setActivateTarget] = useState(null)

  const [loading, setLoading] = useState(true)

  // ── Fetch player applications ──────────────────────────────
  const fetchApps = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('player_applications')
      .select('*, teams(name), users!player_applications_reviewed_by_fkey(name)')
    if (appFilter !== 'all') q = q.eq('status', appFilter)
    const { data } = await q.order('created_at', { ascending: false })
    setApps(data || [])
    setLoading(false)
  }, [appFilter])

  // ── Fetch pending staff/managers ───────────────────────────
  const fetchPendingStaff = useCallback(async () => {
    setStaffLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*, teams(name)')
      .eq('is_active', false)
      .in('role', ['staff', 'team_manager'])
      .order('created_at', { ascending: false })
    setPendingStaff(data || [])
    setStaffLoading(false)
  }, [])

  useEffect(() => { fetchApps() },        [fetchApps])
  useEffect(() => { fetchPendingStaff() }, [fetchPendingStaff])

  // ── Approve player ─────────────────────────────────────────
  async function handleApprove() {
    setProcessing(true)
    const { error } = await supabase.rpc('approve_player_application', {
      app_id: selected.id, reviewer_id: user.id, notes: notes || null,
    })
    setProcessing(false)
    if (error) { addToast({ message:'Gagal approve: ' + error.message, type:'danger' }); return }
    addToast({ message:`${selected.nickname} berhasil di-approve!`, type:'success' })
    setSelected(null); setNotes(''); fetchApps()
  }

  // ── Reject player ──────────────────────────────────────────
  async function handleReject() {
    setProcessing(true)
    const { error } = await supabase.rpc('reject_player_application', {
      app_id: selected.id, reviewer_id: user.id, notes: notes || null,
    })
    setProcessing(false)
    if (error) { addToast({ message:'Gagal reject: ' + error.message, type:'danger' }); return }
    addToast({ message:`Pendaftaran ${selected.nickname} ditolak.`, type:'success' })
    setSelected(null); setNotes(''); fetchApps()
  }

  // ── Activate staff/manager account ────────────────────────
  async function handleActivateStaff() {
    setProcessing(true)
    const { error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', activateTarget.id)
    setProcessing(false)
    if (error) { addToast({ message:'Gagal aktivasi: ' + error.message, type:'danger' }); return }
    addToast({ message:`Akun ${activateTarget.name || activateTarget.email} berhasil diaktivasi!`, type:'success' })
    setActivateTarget(null)
    fetchPendingStaff()
  }

  const pendingCount      = apps.filter(a => a.status === 'pending').length
  const pendingStaffCount = pendingStaff.length

  return (
    <DashboardLayout title="Approvals">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3, display:'flex', alignItems:'center', gap:8 }}>
            Approval & Verifikasi
            {(pendingCount + pendingStaffCount) > 0 && (
              <span style={{ background:'var(--red)', color:'white', fontSize:10, fontWeight:700, borderRadius:10, padding:'2px 7px', fontFamily:'Syne,sans-serif' }}>
                {pendingCount + pendingStaffCount}
              </span>
            )}
          </h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            Review pendaftaran player dan aktivasi akun staff/manager baru.
          </p>
        </div>
        <button className="btn" style={{ padding:'6px 10px' }}
          onClick={() => { fetchApps(); fetchPendingStaff() }}>
          <RefreshCw size={12} className={(loading || staffLoading) ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Main tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        <button
          className={`btn${tab === 'players' ? ' btn-primary' : ''}`}
          style={{ fontSize:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}
          onClick={() => setTab('players')}>
          <User size={12}/> Pendaftaran Player
          {pendingCount > 0 && (
            <span style={{ background: tab === 'players' ? 'rgba(255,255,255,0.25)' : 'var(--red)', color:'white', fontSize:10, fontWeight:700, borderRadius:8, padding:'1px 6px' }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          className={`btn${tab === 'staff' ? ' btn-primary' : ''}`}
          style={{ fontSize:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}
          onClick={() => setTab('staff')}>
          <UserCog size={12}/> Verifikasi Staff/Manager
          {pendingStaffCount > 0 && (
            <span style={{ background: tab === 'staff' ? 'rgba(255,255,255,0.25)' : '#3b82f6', color:'white', fontSize:10, fontWeight:700, borderRadius:8, padding:'1px 6px' }}>
              {pendingStaffCount}
            </span>
          )}
        </button>
      </div>

      {/* ── PLAYER APPLICATIONS TAB ── */}
      {tab === 'players' && (
        <>
          {/* Sub-filter */}
          <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { key:'pending',  label:'Menunggu' },
              { key:'approved', label:'Approved' },
              { key:'rejected', label:'Ditolak' },
              { key:'all',      label:'Semua' },
            ].map(f => (
              <button key={f.key}
                className={`btn${appFilter === f.key ? ' btn-primary' : ''}`}
                style={{ fontSize:12, padding:'5px 12px' }}
                onClick={() => setAppFilter(f.key)}>
                {f.label}{f.key === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p>
          ) : apps.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'48px 24px' }}>
              <CheckCircle size={36} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }}/>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                {appFilter === 'pending' ? 'Tidak ada pendaftaran yang menunggu review.' : 'Tidak ada data.'}
              </p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {apps.map(app => (
                <AppCard key={app.id} app={app} onReview={a => { setSelected(a); setNotes('') }}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── STAFF/MANAGER VERIFICATION TAB ── */}
      {tab === 'staff' && (
        <>
          <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
            <p style={{ fontSize:12, color:'#60a5fa', lineHeight:1.6 }}>
              <strong>Cara kerja:</strong> Staff/Manager yang mendaftar via invite link perlu memverifikasi email mereka terlebih dahulu, lalu Super Admin harus mengaktivasi akun mereka di sini sebelum bisa login.
            </p>
          </div>

          {staffLoading ? (
            <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p>
          ) : pendingStaff.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'48px 24px' }}>
              <CheckCircle size={36} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }}/>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>Tidak ada akun staff/manager yang menunggu aktivasi.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {pendingStaff.map(u => (
                <StaffCard key={u.id} u={u} onActivate={u => setActivateTarget(u)}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Player Review Modal ── */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Pendaftaran Player">
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--bg-surface)', borderRadius:10, padding:'14px', border:'1px solid var(--border-1)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
                {[
                  ['Nickname',      selected.nickname],
                  ['Nama Asli',     selected.full_name],
                  ['Tempat Lahir',  selected.birth_place],
                  ['Tanggal Lahir', selected.birth_date ? new Date(selected.birth_date).toLocaleDateString('id-ID') : '—'],
                  ['Alamat',        selected.address],
                  ['Domisili',      selected.domicile],
                  ['Jenis Esport',  selected.esport_type],
                  ['Tim',           selected.teams?.name || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{k}</p>
                    <p style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Catatan (Opsional)</label>
              <input className="form-input" placeholder="Tambahkan catatan untuk player ini..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:'center', gap:6 }}
                disabled={processing} onClick={handleReject}>
                <XCircle size={14}/> Tolak
              </button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', gap:6 }}
                disabled={processing} onClick={handleApprove}>
                <CheckCircle size={14}/> {processing ? 'Memproses...' : 'Approve'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Staff Activate Confirm Modal ── */}
      {activateTarget && (
        <Modal open={!!activateTarget} onClose={() => setActivateTarget(null)} title="Aktivasi Akun">
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg-surface)', borderRadius:10, padding:'14px', border:'1px solid var(--border-1)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
                {[
                  ['Nama',  activateTarget.name || '—'],
                  ['Email', activateTarget.email],
                  ['Role',  ROLE_LABEL[activateTarget.role] || activateTarget.role],
                  ['Tim',   activateTarget.teams?.name || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{k}</p>
                    <p style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize:12, color:'var(--text-muted)' }}>
              Mengaktivasi akun ini akan memungkinkan pengguna untuk login ke dashboard. Pastikan mereka sudah memverifikasi email mereka.
            </p>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn" style={{ flex:1, justifyContent:'center' }}
                onClick={() => setActivateTarget(null)}>
                Batal
              </button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', gap:6 }}
                disabled={processing} onClick={handleActivateStaff}>
                <CheckCircle size={14}/> {processing ? 'Mengaktivasi...' : 'Aktifkan Akun'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}