import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { detectPlatform } from '@/lib/scraper'
import { Loader2, CheckCircle } from 'lucide-react'

const TOURNAMENTS = [
  { id: 't1', name: 'MPL ID Season 15',  platform: 'Official',  pb: 'badge-blue',  format: 'Round Robin', date: 'Jan–Mar 2025',       teams: 8,  placement: '4th place', status: 'Completed' },
  { id: 't2', name: 'MDL Season 8',      platform: 'Official',  pb: 'badge-blue',  format: 'Double Elim', date: 'Apr 2025 (ongoing)', teams: 16, placement: 'Top 8',     status: 'Ongoing' },
  { id: 't3', name: 'ML Weekly Cup #24', platform: 'Challonge', pb: 'badge-slate', format: 'Single Elim', date: '17 Apr 2025',        teams: 12, placement: '2nd place', status: 'Ongoing' },
]

const STEPS = ['Detecting platform...', 'Fetching bracket and match data...', 'Parsing team and result data...', 'Ready to import.']

export default function TournamentsPage() {
  const [url, setUrl]           = useState('')
  const [step, setStep]         = useState(-1)
  const [done, setDone]         = useState(false)
  const [syncTarget, setSyncTarget] = useState(null)

  function handleImport() {
    if (!url.trim()) return
    setStep(0); setDone(false)
    let cur = 0
    const iv = setInterval(() => {
      cur++
      setStep(cur)
      if (cur >= STEPS.length - 1) { clearInterval(iv); setDone(true) }
    }, 700)
  }

  return (
    <DashboardLayout title="Phantom Five" subtitle="Tournaments">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Tournaments</h2>
      <p className="text-xs text-slate-400 mb-4">Import tournament data and manage records.</p>

      <div className="card mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Import from URL</p>
        <p className="text-xs text-slate-400 mb-3">Paste a URL from Challonge, start.gg, Toornament, or any other platform. The system will detect and import automatically.</p>
        <div className="flex gap-2 mb-3">
          <input className="form-input flex-1" placeholder="https://challonge.com/tournaments/..." value={url} onChange={e => setUrl(e.target.value)} />
          <button className="btn btn-primary" onClick={handleImport} disabled={step >= 0 && !done}>Import</button>
        </div>
        {step >= 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            {!done
              ? <Loader2 size={12} className="animate-spin text-brand-500 flex-shrink-0" />
              : <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
            }
            <span>{STEPS[Math.min(step, STEPS.length - 1)]}</span>
            {done && (
              <button className="btn btn-success text-xs py-1 ml-auto" onClick={() => { setStep(-1); setDone(false); setUrl('') }}>
                Review and import
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Tournament records</p>
        <table className="w-full">
          <thead>
            <tr>{['Tournament', 'Platform', 'Format', 'Date', 'Teams', 'Placement', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {TOURNAMENTS.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="table-td font-medium">{t.name}</td>
                <td className="table-td"><span className={`badge ${t.pb}`}>{t.platform}</span></td>
                <td className="table-td text-slate-500">{t.format}</td>
                <td className="table-td text-slate-400">{t.date}</td>
                <td className="table-td font-mono">{t.teams}</td>
                <td className="table-td"><span className="badge badge-green">{t.placement}</span></td>
                <td className="table-td"><span className={`badge ${t.status === 'Ongoing' ? 'badge-blue' : 'badge-slate'}`}>{t.status}</span></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button className="btn text-xs py-1">Details</button>
                    {t.status === 'Ongoing' && <button className="btn btn-primary text-xs py-1" onClick={() => setSyncTarget(t)}>Sync</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!syncTarget} onClose={() => setSyncTarget(null)} title="Sync tournament" size="sm"
        footer={<><Button onClick={() => setSyncTarget(null)}>Cancel</Button><Button variant="primary" onClick={() => setSyncTarget(null)}>Sync now</Button></>}
      >
        <p>Re-fetch latest results for <strong className="text-slate-800">{syncTarget?.name}</strong>?</p>
        <p className="mt-2 text-xs text-slate-400">New results will be added. Existing records will not be overwritten.</p>
      </Modal>
    </DashboardLayout>
  )
}
