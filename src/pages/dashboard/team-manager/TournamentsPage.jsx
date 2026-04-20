import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { detectPlatform } from '@/lib/scraper'
import { Loader2, CheckCircle } from 'lucide-react'

const STEPS = [
  'Detecting platform...',
  'Fetching bracket and match data...',
  'Parsing team and result data...',
  'Ready to import.',
]

const PLATFORM_BADGE = { Official:'badge-blue', Challonge:'badge-slate', 'start.gg':'badge-slate', Toornament:'badge-slate', Other:'badge-slate' }

export default function TournamentsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [tournaments, setTournaments] = useState([])
  const [teamId, setTeamId]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [url, setUrl]                 = useState('')
  const [step, setStep]               = useState(-1)
  const [scraped, setScraped]         = useState(null)
  const [syncTarget, setSyncTarget]   = useState(null)
  const [importForm, setImportForm]   = useState({ name:'', platform:'Other', format:'', date_label:'', placement:'', total_teams:'' })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) { setLoading(false); return }
      setTeamId(profile.team_id)
      const { data } = await supabase.from('tournaments').select('*').eq('team_id', profile.team_id).order('created_at', { ascending: false })
      setTournaments(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  function handleScrape() {
    if (!url.trim()) return
    const platform = detectPlatform(url)
    setStep(0); setScraped(null)
    const platformLabel = { challonge:'Challonge', startgg:'start.gg', toornament:'Toornament', battlefy:'Battlefy', generic:'Other' }[platform] || 'Other'
    setImportForm(f => ({ ...f, platform: platformLabel }))
    let cur = 0
    const iv = setInterval(() => {
      cur++; setStep(cur)
      if (cur >= STEPS.length - 1) { clearInterval(iv); setScraped({ platform: platformLabel, url }) }
    }, 700)
  }

  async function confirmImport() {
    if (!teamId) return
    const { data, error } = await supabase.from('tournaments').insert({
      team_id:     teamId,
      name:        importForm.name || `Tournament (${importForm.platform})`,
      platform:    importForm.platform,
      format:      importForm.format || null,
      date_label:  importForm.date_label || null,
      placement:   importForm.placement || null,
      total_teams: parseInt(importForm.total_teams) || null,
      source_url:  url,
      status:      'Ongoing',
    }).select().single()

    if (error) { addToast({ message: `Import failed: ${error.message}`, type: 'danger' }); return }
    setTournaments(prev => [data, ...prev])
    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Imported tournament', target: data.name })
    addToast({ message: `${data.name} imported.`, type: 'success' })
    setUrl(''); setStep(-1); setScraped(null)
  }

  async function handleSync(t) {
    addToast({ message: `Syncing ${t.name}...`, type: 'info' })
    await supabase.from('tournaments').update({ status: t.status }).eq('id', t.id)
    setSyncTarget(null)
    addToast({ message: 'Sync complete.', type: 'success' })
  }

  if (loading) return <DashboardLayout title="Tournaments"><p className="text-sm text-slate-400 mt-4">Loading...</p></DashboardLayout>

  return (
    <DashboardLayout title="Tournaments">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Tournaments</h2>
      <p className="text-xs text-slate-400 mb-4">Import tournament data and manage records.</p>

      <div className="card mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Import from URL</p>
        <p className="text-xs text-slate-400 mb-3">Paste a URL from Challonge, start.gg, Toornament, or any other platform.</p>
        <div className="flex gap-2 mb-3">
          <input className="form-input flex-1" placeholder="https://challonge.com/..." value={url} onChange={e=>setUrl(e.target.value)} />
          <button className="btn btn-primary" onClick={handleScrape} disabled={step>=0 && !scraped}>Import</button>
        </div>
        {step >= 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            {!scraped ? <Loader2 size={12} className="animate-spin text-brand-500 flex-shrink-0"/> : <CheckCircle size={12} className="text-emerald-500 flex-shrink-0"/>}
            <span>{STEPS[Math.min(step, STEPS.length-1)]}</span>
            {scraped && <button className="btn btn-success text-xs py-1 ml-auto" onClick={()=>document.getElementById('import-form').classList.toggle('hidden')}>Fill details & confirm</button>}
          </div>
        )}
        {scraped && (
          <div id="import-form" className="hidden mt-3 grid grid-cols-3 gap-3">
            <div><label className="form-label">Tournament name</label><input className="form-input" placeholder="Name" value={importForm.name} onChange={e=>setImportForm(f=>({...f,name:e.target.value}))} /></div>
            <div><label className="form-label">Format</label><input className="form-input" placeholder="e.g. Single Elim" value={importForm.format} onChange={e=>setImportForm(f=>({...f,format:e.target.value}))} /></div>
            <div><label className="form-label">Date / Period</label><input className="form-input" placeholder="e.g. Apr 2025" value={importForm.date_label} onChange={e=>setImportForm(f=>({...f,date_label:e.target.value}))} /></div>
            <div><label className="form-label">Our placement</label><input className="form-input" placeholder="e.g. Top 8" value={importForm.placement} onChange={e=>setImportForm(f=>({...f,placement:e.target.value}))} /></div>
            <div><label className="form-label">Total teams</label><input type="number" className="form-input" placeholder="e.g. 16" value={importForm.total_teams} onChange={e=>setImportForm(f=>({...f,total_teams:e.target.value}))} /></div>
            <div className="flex items-end"><button className="btn btn-primary w-full" onClick={confirmImport}>Save to records</button></div>
          </div>
        )}
      </div>

      <div className="card">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Tournament records</p>
        {tournaments.length === 0
          ? <p className="text-xs text-slate-400 py-4 text-center">No tournaments yet. Import one above.</p>
          : (
            <table className="w-full">
              <thead><tr>{['Tournament','Platform','Format','Date','Teams','Placement','Status','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="table-td font-medium">{t.name}</td>
                    <td className="table-td"><span className={`badge ${PLATFORM_BADGE[t.platform]||'badge-slate'}`}>{t.platform}</span></td>
                    <td className="table-td text-slate-500">{t.format || '—'}</td>
                    <td className="table-td text-slate-400">{t.date_label || '—'}</td>
                    <td className="table-td font-mono">{t.total_teams || '—'}</td>
                    <td className="table-td">{t.placement ? <span className="badge badge-green">{t.placement}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="table-td"><span className={`badge ${t.status==='Ongoing'?'badge-blue':'badge-slate'}`}>{t.status}</span></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="btn text-xs py-1">Details</button>
                        {t.status === 'Ongoing' && <button className="btn btn-primary text-xs py-1" onClick={()=>setSyncTarget(t)}>Sync</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={!!syncTarget} onClose={()=>setSyncTarget(null)} title="Sync tournament" size="sm"
        footer={<><Button onClick={()=>setSyncTarget(null)}>Cancel</Button><Button variant="primary" onClick={()=>handleSync(syncTarget)}>Sync now</Button></>}
      >
        <p>Re-fetch latest results for <strong className="text-slate-800">{syncTarget?.name}</strong>?</p>
        <p className="mt-2 text-xs text-slate-400">New results will be added. Existing records will not be overwritten.</p>
      </Modal>
    </DashboardLayout>
  )
}
