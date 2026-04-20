import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Global Settings</h2>
      <p className="text-xs text-slate-400 mb-4">Application-wide configuration.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">App identity</p>
          <div className="space-y-3">
            <div><label className="form-label">Application name</label><input className="form-input" defaultValue="Nexus" /></div>
            <div><label className="form-label">Tagline</label><input className="form-input" defaultValue="Esports team management platform" /></div>
            <button className="btn btn-primary text-xs mt-1">Save changes</button>
          </div>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Scraping configuration</p>
          <div className="space-y-3">
            <div><label className="form-label">Timeout (seconds)</label><input className="form-input" type="number" defaultValue={30} /></div>
            <div><label className="form-label">Max retries on failure</label><input className="form-input" type="number" defaultValue={3} /></div>
            <button className="btn btn-primary text-xs mt-1">Save changes</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
