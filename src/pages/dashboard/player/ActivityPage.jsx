import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

const TYPES = ['Team scrim', 'Solo rank', 'Review / VOD', 'Physical training', 'Other']

const DOT_COLOR = {
  'Team scrim':        'bg-brand-400',
  'Solo rank':         'bg-emerald-400',
  'Review / VOD':      'bg-amber-400',
  'Physical training': 'bg-rose-400',
  'Other':             'bg-slate-300',
}

const FEED = [
  { type: 'Team scrim',      duration: '120 min', when: 'Today 09:00',     note: 'Gold lane practice. Need to improve map awareness and rotations.' },
  { type: 'Solo rank',       duration: '60 min',  when: 'Yesterday 21:00', note: 'Reached Mythic. Practiced Layla and Bruno matchups.' },
  { type: 'Review / VOD',    duration: '45 min',  when: 'Yesterday 14:00', note: 'Reviewed MDL S8 match vs Nova Squad.' },
  { type: 'Physical training', duration: '60 min',when: '16 Apr',          note: 'Gym session.' },
]

export default function ActivityPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState({ type: 'Team scrim', duration: '', note: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('player_activities').insert({
      activity_type: form.type,
      duration_minutes: parseInt(form.duration),
      notes: form.note,
    })
    if (error) addToast({ message: 'Failed to save activity.', type: 'danger' })
    else { addToast({ message: 'Activity logged.', type: 'success' }); setForm(f => ({ ...f, duration: '', note: '' })) }
    setSaving(false)
  }

  return (
    <DashboardLayout title="Activity Log">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Activity Log</h2>
      <p className="text-xs text-slate-400 mb-4">Your personal training and activity records.</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Log today</p>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="form-label">Activity type</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Duration (minutes)</label>
              <input type="number" className="form-input" placeholder="e.g. 90" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input resize-none" rows={3} placeholder="What did you work on?" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center" disabled={saving}>
              {saving ? 'Saving...' : 'Save activity'}
            </button>
          </form>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent activity</p>
          <div className="space-y-4">
            {FEED.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLOR[item.type] || 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-slate-700">{item.type}</span>
                    <span className="text-xs text-slate-400">{item.duration}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.note}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{item.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
