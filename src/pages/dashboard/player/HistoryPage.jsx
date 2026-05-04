// HistoryPage.jsx — fix damage bug + edit/delete match
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Pencil, Trash2, X, Loader2, AlertTriangle } from 'lucide-react'

const inp = {
  width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 7,
  background: '#f6f5f4', border: '1px solid rgba(0,0,0,0.12)',
  color: '#1a1a1a', outline: 'none',
}

/* ─── Modal Edit ─── */
function EditModal({ record, userId, onClose, onSaved }) {
  const { addToast } = useToast()
  const isOwner = record?.match?.created_by === userId
  const [form, setForm] = useState({
    opponent:   record?.match?.opponent   || '',
    result:     record?.match?.result     || 'Win',
    score:      record?.match?.score      || '',
    tournament: record?.match?.tournament || '',
    round:      record?.match?.round      || '',
  })
  const [stat, setStat] = useState({
    hero:    record?.hero    || '',
    kills:   record?.kills   ?? 0,
    deaths:  record?.deaths  ?? 0,
    assists: record?.assists ?? 0,
    mvp:     record?.mvp     || false,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.opponent.trim()) { addToast({ message: 'Nama lawan wajib diisi!', type: 'danger' }); return }
    setSaving(true)
    try {
      if (isOwner) {
        const { error } = await supabase.from('matches').update({
          opponent: form.opponent, result: form.result,
          score: form.score || null, tournament: form.tournament || null, round: form.round || null,
        }).eq('id', record.match.id)
        if (error) throw new Error(error.message)
      }
      const { error: se } = await supabase.from('match_player_stats').update({
        hero: stat.hero, kills: parseInt(stat.kills)||0,
        deaths: parseInt(stat.deaths)||0, assists: parseInt(stat.assists)||0, mvp: stat.mvp,
      }).eq('id', record.id)
      if (se) throw new Error(se.message)
      addToast({ message: 'Match berhasil diupdate!', type: 'success' })
      onSaved(); onClose()
    } catch (err) {
      addToast({ message: 'Gagal: ' + err.message, type: 'danger' })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:480, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a', fontFamily:'Syne,sans-serif' }}>✏️ Edit Match</p>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#a39e98', padding:4 }}><X size={16}/></button>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:18 }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#a39e98', marginBottom:10, fontFamily:'Syne,sans-serif' }}>
            Detail Match {!isOwner && <span style={{ color:'#dd5b00', fontWeight:400 }}>(hanya bisa diedit oleh pembuat match)</span>}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:10, marginBottom:16 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Nama Lawan</label>
              <input style={{ ...inp, opacity: isOwner?1:0.5 }} disabled={!isOwner} value={form.opponent} onChange={e => setForm(f=>({...f,opponent:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Hasil</label>
              <select style={{ ...inp, opacity: isOwner?1:0.5 }} disabled={!isOwner} value={form.result} onChange={e => setForm(f=>({...f,result:e.target.value}))}>
                <option value="Win">Win</option><option value="Loss">Loss</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Skor</label>
              <input style={{ ...inp, opacity: isOwner?1:0.5 }} disabled={!isOwner} value={form.score} onChange={e => setForm(f=>({...f,score:e.target.value}))} placeholder="3-1" />
            </div>
            <div>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Tournament</label>
              <input style={{ ...inp, opacity: isOwner?1:0.5 }} disabled={!isOwner} value={form.tournament} onChange={e => setForm(f=>({...f,tournament:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Babak</label>
              <input style={{ ...inp, opacity: isOwner?1:0.5 }} disabled={!isOwner} value={form.round} onChange={e => setForm(f=>({...f,round:e.target.value}))} />
            </div>
          </div>
          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#a39e98', marginBottom:10, fontFamily:'Syne,sans-serif' }}>Stats Kamu</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:10 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3 }}>Hero</label>
              <input style={inp} value={stat.hero} onChange={e => setStat(s=>({...s,hero:e.target.value}))} placeholder="Nama hero" />
            </div>
            {['kills','deaths','assists'].map(f => (
              <div key={f}>
                <label style={{ fontSize:11, color:'#615d59', display:'block', marginBottom:3, textTransform:'capitalize' }}>{f==='kills'?'Kill':f==='deaths'?'Death':'Assist'}</label>
                <input type="number" min={0} style={inp} value={stat[f]} onChange={e => setStat(s=>({...s,[f]:e.target.value}))} />
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:18 }}>
              <input type="checkbox" id="mvp-chk" checked={stat.mvp} onChange={e => setStat(s=>({...s,mvp:e.target.checked}))} style={{ accentColor:'var(--brand)', width:15, height:15, cursor:'pointer' }} />
              <label htmlFor="mvp-chk" style={{ fontSize:12, fontWeight:600, color:'#1a1a1a', cursor:'pointer' }}>MVP</label>
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(0,0,0,0.08)', display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:600, background:'#f0efee', border:'1px solid rgba(0,0,0,0.1)', color:'#615d59', cursor:'pointer', fontFamily:'Syne,sans-serif' }}>Batal</button>
          <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:700, background:saving?'#f0efee':'var(--brand)', border:'none', color:saving?'#615d59':'#fff', cursor:saving?'not-allowed':'pointer', fontFamily:'Syne,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {saving ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Menyimpan...</> : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ─── Modal Hapus ─── */
function DeleteModal({ record, userId, onClose, onDeleted }) {
  const { addToast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const isOwner = record?.match?.created_by === userId

  async function handleDelete() {
    setDeleting(true)
    try {
      if (isOwner) {
        await supabase.from('match_player_stats').delete().eq('match_id', record.match.id)
        const { error } = await supabase.from('matches').delete().eq('id', record.match.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('match_player_stats').delete().eq('id', record.id)
        if (error) throw new Error(error.message)
      }
      addToast({ message: isOwner ? 'Match dihapus.' : 'Stats kamu dihapus dari match ini.', type: 'success' })
      onDeleted(); onClose()
    } catch (err) {
      addToast({ message: 'Gagal hapus: ' + err.message, type: 'danger' })
    } finally { setDeleting(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:380, padding:24, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', gap:12, marginBottom:18 }}>
          <AlertTriangle size={22} style={{ color:'#dd3545', flexShrink:0, marginTop:2 }} />
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', fontFamily:'Syne,sans-serif' }}>{isOwner ? 'Hapus Match?' : 'Hapus Stats Kamu?'}</p>
            <p style={{ fontSize:12, color:'#615d59', marginTop:4, lineHeight:1.5 }}>
              {isOwner
                ? `Match vs "${record?.match?.opponent}" dan semua stats pemain akan dihapus permanen.`
                : `Stats kamu pada match vs "${record?.match?.opponent}" akan dihapus. Data pemain lain tidak terpengaruh.`}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:600, background:'#f0efee', border:'1px solid rgba(0,0,0,0.1)', color:'#615d59', cursor:'pointer' }}>Batal</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:12, fontWeight:700, background:deleting?'#f0efee':'#dd3545', border:'none', color:deleting?'#615d59':'#fff', cursor:deleting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {deleting ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : null}
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

/* ─── MAIN PAGE ─── */
export default function HistoryPage() {
  const { user } = useAuth()
  const [records,      setRecords]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('all')
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('match_player_stats')
      .select('id, kills, deaths, assists, hero, mvp, match_id, matches(id, result, opponent, tournament, date, score, round, created_by)')
      .eq('player_id', user.id)
      .order('created_at', { ascending: false })
    setRecords((data || []).map(r => ({ ...r, match: r.matches })))
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const filtered = records.filter(r => filter === 'all' || r.match?.result === filter)
  const wins = records.filter(r => r.match?.result === 'Win').length
  const wr   = records.length ? Math.round((wins / records.length) * 100) : 0
  const avgKDA = records.length
    ? (records.reduce((s, r) => {
        return s + (r.deaths === 0 ? (r.kills + r.assists) : ((r.kills + r.assists) / r.deaths))
      }, 0) / records.length).toFixed(2)
    : '—'

  return (
    <DashboardLayout title="Match History">
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Match History</h2>
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Semua match tercatat milikmu season ini.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap:12, marginBottom:16 }}>
        {[['TOTAL MATCH', records.length], ['WIN RATE', `${wr}%`], ['AVG KDA', avgKDA]].map(([l,v]) => (
          <div key={l} className="card">
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)', fontFamily:'Syne,sans-serif', marginBottom:6 }}>{l}</p>
            <p style={{ fontSize:22, fontWeight:700, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-primary)' }}>{v}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          {[['all','Semua'],['Win','Menang'],['Loss','Kalah']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} className={filter===v ? 'btn btn-primary' : 'btn'} style={{ fontSize:12, padding:'5px 12px' }}>{l}</button>
          ))}
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-dim)' }}>{filtered.length} match</span>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--text-dim)', padding:'24px 0', fontSize:12 }}>Tidak ada data match.</p>
        ) : (
          <div className="table-scroll-container">
            <table style={{ width:'100%', minWidth:600 }}>
              <thead>
                <tr>
                  {['Tournament','Lawan','Hero','K/D/A','KDA','Hasil','MVP','Tanggal','Aksi'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const kda = r.deaths === 0 ? (r.kills + r.assists) : ((r.kills + r.assists) / r.deaths)
                  return (
                    <tr key={i}>
                      <td className="table-td" style={{ fontSize:12, color:'var(--text-muted)' }}>{r.match?.tournament || '—'}</td>
                      <td className="table-td" style={{ fontWeight:500 }}>{r.match?.opponent || '—'}</td>
                      <td className="table-td" style={{ fontSize:12 }}>{r.hero || '—'}</td>
                      <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>{r.kills}/{r.deaths}/{r.assists}</td>
                      <td className="table-td" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color:'var(--red)' }}>{kda.toFixed(2)}</td>
                      <td className="table-td">
                        <span className={`badge ${r.match?.result==='Win'?'badge-green':'badge-red'}`}>{r.match?.result||'—'}</span>
                      </td>
                      <td className="table-td">
                        {r.mvp ? <span className="badge badge-amber">MVP</span> : <span style={{ color:'var(--text-dim)' }}>—</span>}
                      </td>
                      <td className="table-td" style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace' }}>{r.match?.date || '—'}</td>
                      <td className="table-td">
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => setEditTarget(r)} title="Edit"
                            style={{ padding:'4px 8px', borderRadius:6, background:'rgba(0,117,222,0.08)', border:'1px solid rgba(0,117,222,0.2)', color:'var(--blue)', cursor:'pointer' }}>
                            <Pencil size={12}/>
                          </button>
                          <button onClick={() => setDeleteTarget(r)} title="Hapus"
                            style={{ padding:'4px 8px', borderRadius:6, background:'rgba(221,53,69,0.08)', border:'1px solid rgba(221,53,69,0.2)', color:'var(--red)', cursor:'pointer' }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget   && <EditModal   record={editTarget}   userId={user?.id} onClose={() => setEditTarget(null)}   onSaved={load} />}
      {deleteTarget && <DeleteModal record={deleteTarget} userId={user?.id} onClose={() => setDeleteTarget(null)} onDeleted={load} />}
    </DashboardLayout>
  )
}