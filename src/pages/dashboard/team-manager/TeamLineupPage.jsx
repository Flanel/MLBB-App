// TeamLineupPage.jsx — Tim Tetap (permanent competitive lineup)
// Tim ≠ Squad:
//   Tim   = lineup tetap yang diturunkan ke tournament, dihubungkan ke Schedule
//   Squad = kelompok fleksibel untuk scrim/practice
//
// Fitur:
// • CRUD Tim dengan maksimum 5 pemain + role (captain, gold, exp, mid, jungle, roam)
// • Set Kapten per Tim (1 orang)
// • Tim terhubung ke Schedule (schedule bisa assign ke Tim)
// • Notifikasi dikirim ke player anggota Tim ketika ada jadwal baru

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  Plus, Trash2, Users, ChevronDown, ChevronUp,
  Crown, UserCheck, X, Bell, Shield, Edit2, CheckCircle
} from 'lucide-react'

const TEAM_ROLES = ['Kapten','Jungle','Gold Lane','Exp Lane','Mid','Roam','Sub/Reserve']
const ROLE_COLOR = {
  Kapten:'#f59e0b', Jungle:'var(--red)', 'Gold Lane':'#facc15',
  'Exp Lane':'var(--blue)', Mid:'var(--brand)', Roam:'#a78bfa', 'Sub/Reserve':'var(--text-dim)',
}
const TEAM_STATUS = ['Active','Standby','Disbanded']
const STATUS_COLOR = { Active:'var(--green)', Standby:'var(--amber)', Disbanded:'var(--text-dim)' }

export default function TeamLineupPage() {
  const { user }     = useAuth()
  const { addToast } = useToast()

  const [lineups,   setLineups]   = useState([])
  const [players,   setPlayers]   = useState([])
  const [teamId,    setTeamId]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState({})

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name:'', tag:'', description:'', status:'Active' })
  const [creating,   setCreating]   = useState(false)

  // Add member modal
  const [addTo,       setAddTo]       = useState(null)
  const [addForm,     setAddForm]     = useState({ player_id:'', role_in_team:'Jungle', is_captain:false })
  const [addingMember, setAddingMember] = useState(false)

  // Edit captain modal
  const [editCapTarget, setEditCapTarget] = useState(null)
  const [newCaptainId,  setNewCaptainId]  = useState('')

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data:me } = await supabase.from('users').select('team_id').eq('id',user.id).single()
      if (!me?.team_id) { setLoading(false); return }
      setTeamId(me.team_id)
      await fetchAll(me.team_id)
      setLoading(false)
    }
    load()
  }, [user])

  async function fetchAll(tid) {
    const [{ data:lu }, { data:pl }] = await Promise.all([
      supabase.from('team_lineups')
        .select('*, team_lineup_members(id, role_in_team, is_captain, users(id,name,ign,lane,province,city))')
        .eq('team_id', tid)
        .order('created_at', { ascending:false }),
      supabase.from('users')
        .select('id,name,ign,lane,province,city,is_active,role')
        .eq('team_id', tid).eq('is_active', true)
        .in('role', ['player','staff'])
        .order('name'),
    ])
    setLineups(lu||[])
    setPlayers(pl||[])
  }

  async function handleCreate() {
    if (!createForm.name.trim()) { addToast({ message:'Nama tim wajib diisi.', type:'danger' }); return }
    setCreating(true)
    const { data, error } = await supabase.from('team_lineups').insert({
      team_id: teamId, name: createForm.name.trim(),
      tag: createForm.tag.trim().toUpperCase() || null,
      description: createForm.description || null,
      status: createForm.status, created_by: user.id,
    }).select('*, team_lineup_members(id,role_in_team,is_captain,users(id,name,ign,lane))').single()

    if (error) { addToast({ message:'Gagal: '+error.message, type:'danger' }); setCreating(false); return }
    setLineups(prev => [data, ...prev])
    setExpanded(prev => ({ ...prev, [data.id]: true }))
    addToast({ message:`Tim "${createForm.name}" berhasil dibuat!`, type:'success' })
    setCreateForm({ name:'', tag:'', description:'', status:'Active' })
    setCreateOpen(false)
    setCreating(false)
  }

  async function handleAddMember() {
    if (!addForm.player_id) { addToast({ message:'Pilih pemain.', type:'danger' }); return }
    const lineup = addTo
    const isDup = lineup.team_lineup_members?.some(m => m.users?.id === addForm.player_id)
    if (isDup) { addToast({ message:'Pemain sudah ada di tim ini.', type:'danger' }); return }

    // Cek: jika kapten, hapus kapten lama
    if (addForm.is_captain) {
      const oldCaptain = lineup.team_lineup_members?.find(m => m.is_captain)
      if (oldCaptain) {
        await supabase.from('team_lineup_members').update({ is_captain:false }).eq('id', oldCaptain.id)
      }
    }

    setAddingMember(true)
    const { data, error } = await supabase.from('team_lineup_members').insert({
      lineup_id:   lineup.id,
      player_id:   addForm.player_id,
      role_in_team: addForm.role_in_team,
      is_captain:  addForm.is_captain,
    }).select('id, role_in_team, is_captain, users(id,name,ign,lane,province,city)').single()

    if (error) { addToast({ message:'Gagal: '+error.message, type:'danger' }); setAddingMember(false); return }

    setLineups(prev => prev.map(l =>
      l.id !== lineup.id ? l
        : { ...l, team_lineup_members: [...(l.team_lineup_members||[]), data] }
    ))

    // Notifikasi ke player
    const player = players.find(p => p.id === addForm.player_id)
    if (player) {
      await supabase.from('notifications').insert({
        user_id: player.id,
        title:   `Kamu bergabung ke Tim "${lineup.name}"`,
        body:    `Manager telah menambahkan kamu ke Tim ${lineup.name} sebagai ${addForm.role_in_team}${addForm.is_captain?' (Kapten)':''}.`,
        type:    'squad', meta: { lineup_id: lineup.id },
      }).then(()=>{}).catch(()=>{})
    }

    addToast({ message:`${player?.name||'Pemain'} ditambahkan ke tim.`, type:'success' })
    setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false })
    setAddTo(null)
    setAddingMember(false)
  }

  async function handleRemoveMember(lineup, memberId, playerName) {
    const { error } = await supabase.from('team_lineup_members').delete().eq('id', memberId)
    if (error) { addToast({ message:'Gagal hapus.', type:'danger' }); return }
    setLineups(prev => prev.map(l =>
      l.id !== lineup.id ? l
        : { ...l, team_lineup_members: l.team_lineup_members.filter(m => m.id !== memberId) }
    ))
    addToast({ message:`${playerName} dikeluarkan.`, type:'success' })
  }

  async function handleSetCaptain() {
    if (!newCaptainId || !editCapTarget) return
    const lineup = editCapTarget
    // Hapus kapten lama
    for (const m of lineup.team_lineup_members || []) {
      if (m.is_captain) await supabase.from('team_lineup_members').update({ is_captain:false }).eq('id', m.id)
    }
    // Set kapten baru
    await supabase.from('team_lineup_members').update({ is_captain:true })
      .eq('lineup_id', lineup.id).eq('player_id', newCaptainId)

    setLineups(prev => prev.map(l => {
      if (l.id !== lineup.id) return l
      return {
        ...l,
        team_lineup_members: l.team_lineup_members.map(m => ({
          ...m, is_captain: m.users?.id === newCaptainId,
        }))
      }
    }))

    // Notif ke kapten baru
    await supabase.from('notifications').insert({
      user_id: newCaptainId,
      title:   `Kamu menjadi Kapten Tim "${lineup.name}"`,
      body:    `Manager telah menunjuk kamu sebagai kapten Tim ${lineup.name}.`,
      type:    'squad', meta: { lineup_id: lineup.id },
    }).then(()=>{}).catch(()=>{})

    addToast({ message:'Kapten berhasil diperbarui!', type:'success' })
    setEditCapTarget(null)
    setNewCaptainId('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('team_lineup_members').delete().eq('lineup_id', deleteTarget.id)
    const { error } = await supabase.from('team_lineups').delete().eq('id', deleteTarget.id)
    if (!error) {
      setLineups(prev => prev.filter(l => l.id !== deleteTarget.id))
      addToast({ message:`Tim "${deleteTarget.name}" dihapus.`, type:'success' })
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  function availablePlayers(lineup) {
    const used = new Set(lineup.team_lineup_members?.map(m => m.users?.id).filter(Boolean))
    return players.filter(p => !used.has(p.id))
  }

  return (
    <DashboardLayout title="Tim">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Tim Kompetitif</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            Bentuk tim tetap yang akan diturunkan ke tournament. Tim terhubung ke Schedule dan mengirim notifikasi ke anggotanya.
          </p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => setCreateOpen(true)}>
          <Plus size={13} /> Buat Tim
        </button>
      </div>

      {/* Info box */}
      <div style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
        <Shield size={14} style={{ color:'#38bdf8', flexShrink:0, marginTop:1 }} />
        <div style={{ fontSize:12, color:'#38bdf8', lineHeight:1.6 }}>
          <strong>Tim vs Squad:</strong> <span style={{ color:'var(--text-muted)' }}>
            <strong style={{ color:'var(--text-secondary)' }}>Tim</strong> = lineup tetap untuk tournament (dihubungkan ke Schedule, ada kapten).{' '}
            <strong style={{ color:'var(--text-secondary)' }}>Squad</strong> = kelompok fleksibel untuk scrim/latihan.
          </span>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px 0', fontSize:12 }}>Memuat...</p>
      ) : lineups.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'52px 0' }}>
          <Users size={32} style={{ color:'var(--text-dim)', margin:'0 auto 12px' }} />
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>Belum ada tim. Buat tim kompetitif pertama kamu!</p>
          <button className="btn btn-primary" style={{ margin:'0 auto', display:'flex', gap:6 }} onClick={() => setCreateOpen(true)}>
            <Plus size={12} /> Buat Tim
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {lineups.map(lineup => {
            const isOpen   = !!expanded[lineup.id]
            const members  = lineup.team_lineup_members || []
            const captain  = members.find(m => m.is_captain)
            const statusC  = STATUS_COLOR[lineup.status] || 'var(--text-dim)'

            return (
              <div key={lineup.id} className="card" style={{ borderLeft:`3px solid ${statusC}`, paddingLeft:16 }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      {lineup.tag && (
                        <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'var(--brand-glow)', color:'var(--red)', border:'1px solid rgba(225,29,72,0.2)' }}>
                          [{lineup.tag}]
                        </span>
                      )}
                      <p style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{lineup.name}</p>
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:`${statusC}18`, color:statusC, fontWeight:600 }}>
                        {lineup.status}
                      </span>
                      <span style={{ fontSize:10, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:3 }}>
                        <Users size={10}/> {members.length}/5
                      </span>
                      {captain && (
                        <span style={{ fontSize:10, color:'#f59e0b', display:'flex', alignItems:'center', gap:3 }}>
                          <Crown size={10} fill="#f59e0b"/> Kapten: {captain.users?.ign || captain.users?.name}
                        </span>
                      )}
                    </div>
                    {lineup.description && <p style={{ fontSize:11, color:'var(--text-muted)' }}>{lineup.description}</p>}
                  </div>

                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn" style={{ padding:'5px 10px', fontSize:11, gap:5 }}
                      onClick={() => { setAddTo(lineup); setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false }) }}>
                      <UserCheck size={11}/> Tambah
                    </button>
                    <button className="btn" style={{ padding:'5px 8px', fontSize:11 }}
                      title="Ganti kapten"
                      onClick={() => { setEditCapTarget(lineup); setNewCaptainId(captain?.users?.id||'') }}>
                      <Crown size={11}/>
                    </button>
                    <button className="btn btn-danger" style={{ padding:'5px 8px' }} onClick={() => setDeleteTarget(lineup)}>
                      <Trash2 size={11}/>
                    </button>
                    <button className="btn" style={{ padding:'5px 8px' }}
                      onClick={() => setExpanded(prev => ({ ...prev, [lineup.id]: !isOpen }))}>
                      {isOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                    </button>
                  </div>
                </div>

                {/* Members expanded */}
                {isOpen && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-1)' }}>
                    {members.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'14px 0' }}>
                        <p style={{ fontSize:12, color:'var(--text-dim)', marginBottom:8 }}>Belum ada anggota.</p>
                        <button className="btn" style={{ fontSize:11, gap:5, margin:'0 auto', display:'flex' }}
                          onClick={() => { setAddTo(lineup); setAddForm({ player_id:'', role_in_team:'Jungle', is_captain:false }) }}>
                          <Plus size={10}/> Tambah Pemain
                        </button>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:8 }}>
                        {members.map(m => {
                          const roleColor = ROLE_COLOR[m.role_in_team] || 'var(--text-dim)'
                          return (
                            <div key={m.id} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, border: m.is_captain ? `1px solid rgba(245,158,11,0.3)` : '1px solid transparent' }}>
                              <div style={{ width:32, height:32, borderRadius:8, background: m.is_captain ? 'rgba(245,158,11,0.15)' : 'var(--brand-glow)', border:`1px solid ${m.is_captain ? 'rgba(245,158,11,0.3)' : 'rgba(225,29,72,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color: m.is_captain ? '#f59e0b' : 'var(--red)', fontFamily:'Syne,sans-serif', flexShrink:0 }}>
                                {m.is_captain ? <Crown size={14} fill="#f59e0b"/> : (m.users?.name||'?').charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <p style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {m.users?.ign || m.users?.name || '—'}
                                  </p>
                                  {m.is_captain && <Crown size={10} style={{ color:'#f59e0b', flexShrink:0 }} fill="#f59e0b"/>}
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${roleColor}22`, color:roleColor }}>
                                    {m.role_in_team}
                                  </span>
                                  {m.users?.province && (
                                    <span style={{ fontSize:9, color:'var(--text-dim)' }}>{m.users.province}</span>
                                  )}
                                </div>
                              </div>
                              <button style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:3, borderRadius:4, flexShrink:0 }}
                                onClick={() => handleRemoveMember(lineup, m.id, m.users?.name||'?')}>
                                <X size={12}/>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {members.length > 0 && members.length < 5 && lineup.status === 'Active' && (
                      <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(245,158,11,0.06)', border:'1px dashed rgba(245,158,11,0.3)', borderRadius:8 }}>
                        <p style={{ fontSize:11, color:'#f59e0b' }}>⚠️ Tim kompetitif biasanya butuh 5 pemain inti. Saat ini {members.length} pemain.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Tim Kompetitif" size="sm"
        footer={<><Button onClick={() => setCreateOpen(false)}>Batal</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating?'Membuat...':'Buat Tim'}</Button></>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 90px', gap:10 }}>
            <div>
              <label className="form-label">Nama Tim *</label>
              <input className="form-input" placeholder="e.g. NXK Esports Main" maxLength={60}
                value={createForm.name} onChange={e => setCreateForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Tag Tim</label>
              <input className="form-input" placeholder="NXK" maxLength={5} style={{ textTransform:'uppercase' }}
                value={createForm.tag} onChange={e => setCreateForm(f=>({...f,tag:e.target.value.toUpperCase()}))} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={createForm.status} onChange={e => setCreateForm(f=>({...f,status:e.target.value}))}>
              {TEAM_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Deskripsi (opsional)</label>
            <textarea className="form-input" rows={2} placeholder="e.g. Tim utama untuk Season 3 MLBB Regional"
              value={createForm.description} onChange={e => setCreateForm(f=>({...f,description:e.target.value}))} maxLength={200} />
          </div>
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:8, padding:'10px 12px', display:'flex', gap:8 }}>
            <Bell size={13} style={{ color:'var(--green)', flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:11, color:'var(--green)' }}>Anggota tim ini akan mendapat notifikasi untuk setiap jadwal yang ditujukan ke tim ini.</p>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={!!addTo} onClose={() => setAddTo(null)} title={`Tambah ke "${addTo?.name}"`} size="sm"
        footer={<><Button onClick={() => setAddTo(null)}>Batal</Button><Button variant="primary" onClick={handleAddMember} disabled={addingMember}>{addingMember?'Menambahkan...':'Tambahkan'}</Button></>}
      >
        {addTo && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="form-label">Pemain *</label>
              <select className="form-input" value={addForm.player_id} onChange={e => setAddForm(f=>({...f,player_id:e.target.value}))}>
                <option value="">— Pilih pemain —</option>
                {availablePlayers(addTo).map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.ign&&p.ign!==p.name?` (${p.ign})`:''} — {p.lane||'—'}</option>
                ))}
              </select>
              {availablePlayers(addTo).length === 0 && <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>Semua pemain aktif sudah ada di tim ini.</p>}
            </div>
            <div>
              <label className="form-label">Role di Tim</label>
              <select className="form-input" value={addForm.role_in_team} onChange={e => setAddForm(f=>({...f,role_in_team:e.target.value}))}>
                {TEAM_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 10px', borderRadius:7, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <input type="checkbox" checked={addForm.is_captain} onChange={e => setAddForm(f=>({...f,is_captain:e.target.checked}))} style={{ accentColor:'#f59e0b' }} />
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#f59e0b', display:'flex', alignItems:'center', gap:5 }}><Crown size={12}/> Jadikan Kapten</p>
                <p style={{ fontSize:10, color:'var(--text-dim)' }}>Kapten lama akan otomatis digantikan.</p>
              </div>
            </label>
            <div style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:8, padding:'10px 12px', display:'flex', gap:8 }}>
              <Bell size={12} style={{ color:'#38bdf8', flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:11, color:'#38bdf8' }}>Pemain akan mendapat notifikasi bahwa mereka ditambahkan ke tim ini.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Captain Modal */}
      <Modal open={!!editCapTarget} onClose={() => setEditCapTarget(null)} title={`Ganti Kapten — ${editCapTarget?.name}`} size="sm"
        footer={<><Button onClick={() => setEditCapTarget(null)}>Batal</Button><Button variant="primary" onClick={handleSetCaptain} disabled={!newCaptainId}>Simpan Kapten</Button></>}
      >
        {editCapTarget && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="form-label">Pilih Kapten Baru</label>
              <select className="form-input" value={newCaptainId} onChange={e => setNewCaptainId(e.target.value)}>
                <option value="">— Pilih —</option>
                {(editCapTarget.team_lineup_members||[]).map(m => (
                  <option key={m.id} value={m.users?.id}>{m.users?.ign||m.users?.name} — {m.role_in_team}{m.is_captain?' (Kapten saat ini)':''}</option>
                ))}
              </select>
            </div>
            <p style={{ fontSize:11, color:'var(--text-dim)' }}>Kapten mendapat badge khusus di profil tim dan notifikasi jadwal terlebih dahulu.</p>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Tim" size="sm"
        footer={<><Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</Button><Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting?'Menghapus...':'Hapus'}</Button></>}
      >
        <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
          Hapus tim <strong style={{ color:'var(--text-primary)' }}>"{deleteTarget?.name}"</strong>?
          Semua data anggota dan koneksi ke jadwal akan ikut terhapus.
        </p>
      </Modal>
    </DashboardLayout>
  )
}
