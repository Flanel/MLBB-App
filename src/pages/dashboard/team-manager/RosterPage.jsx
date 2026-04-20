import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

const PLAYERS = [
  { id: 'p1', name: 'Reza P.',  ign: 'RezaGold', lane: 'Gold Lane', kda: '4.8', wr: '71%', matches: 47, status: 'active'   },
  { id: 'p2', name: 'Dito S.',  ign: 'DitoExp',  lane: 'Exp Lane',  kda: '3.9', wr: '66%', matches: 45, status: 'active'   },
  { id: 'p3', name: 'Fajar M.', ign: 'FajarMid', lane: 'Mid',       kda: '5.2', wr: '70%', matches: 47, status: 'active'   },
  { id: 'p4', name: 'Aldo F.',  ign: 'AldoJgl',  lane: 'Jungle',    kda: '4.1', wr: '68%', matches: 42, status: 'active'   },
  { id: 'p5', name: 'Bima R.',  ign: 'BimaRoam', lane: 'Roam',      kda: '2.8', wr: '65%', matches: 38, status: 'inactive' },
]
const LANES = ['Gold Lane', 'Exp Lane', 'Mid', 'Jungle', 'Roam']

export default function RosterPage() {
  const [editTarget, setEditTarget] = useState(null)
  return (
    <DashboardLayout title="Phantom Five" subtitle="Roster">
      <h2 className="text-base font-semibold text-slate-800 mb-0.5">Roster</h2>
      <p className="text-xs text-slate-400 mb-4">Phantom Five player roster.</p>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <input className="form-input max-w-[200px]" placeholder="Search players..." />
          <button className="btn btn-primary text-xs">+ Add player</button>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Player', 'IGN', 'Lane', 'KDA', 'Win rate', 'Matches', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {PLAYERS.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="table-td font-medium">{p.name}</td>
                <td className="table-td font-mono text-xs">{p.ign}</td>
                <td className="table-td">{p.lane}</td>
                <td className="table-td font-mono">{p.kda}</td>
                <td className="table-td font-mono">{p.wr}</td>
                <td className="table-td font-mono">{p.matches}</td>
                <td className="table-td"><span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-slate'}`}>{p.status}</span></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button className="btn text-xs py-1" onClick={() => setEditTarget(p)}>Edit</button>
                    <button className="btn btn-danger text-xs py-1">Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit player"
        footer={<><Button onClick={() => setEditTarget(null)}>Cancel</Button><Button variant="primary" onClick={() => setEditTarget(null)}>Save changes</Button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Full name</label><input className="form-input" defaultValue={editTarget?.name} /></div>
          <div><label className="form-label">IGN</label><input className="form-input" defaultValue={editTarget?.ign} /></div>
          <div>
            <label className="form-label">Lane</label>
            <select className="form-input">
              {LANES.map(l => <option key={l} selected={editTarget?.lane === l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
