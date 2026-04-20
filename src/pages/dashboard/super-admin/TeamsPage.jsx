import { useState, useEffect, useCallback } from 'react'
import { Users, Edit2, Trash2, Power, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TeamFormModal from '@/components/super-admin/TeamFormModal'
import DeactivateModal from '@/components/super-admin/DeactivateModal'
import DeleteTeamModal from '@/components/super-admin/DeleteTeamModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

// ── helpers ─────────────────────────────────────────────────

async function logAudit(userId, action, target) {
  await supabase.from('audit_logs').insert({ user_id: userId, action, target })
}

// ── component ───────────────────────────────────────────────

export default function TeamsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [busy, setBusy]       = useState(false)   // any in-flight mutation

  // modal states
  const [createOpen, setCreateOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)   // team object
  const [deactTarget, setDeactTarget] = useState(null)   // team object
  const [deleteTarget, setDeleteTarget] = useState(null) // team object

  // ── data fetching ──────────────────────────────────────────

  const fetchTeams = useCallback(async () => {
    setLoading(true)

    // DEBUG: join users count per team so we can show member numbers
    const { data, error } = await supabase
      .from('teams')
      .select('*, users(count)')
      .order('created_at', { ascending: false })

    if (error) {
      addToast({ message: `Failed to load teams: ${error.message}`, type: 'danger' })
    } else {
      // flatten the count from Supabase's nested aggregate format
      setTeams(
        (data || []).map(t => ({
          ...t,
          member_count: t.users?.[0]?.count ?? 0,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  // ── CRUD handlers ──────────────────────────────────────────

  async function handleCreate({ name, game }) {
    setBusy(true)
    const { data, error } = await supabase
      .from('teams')
      .insert({ name, game, is_active: true })
      .select()
      .single()

    if (error) {
      addToast({ message: `Failed to create team: ${error.message}`, type: 'danger' })
    } else {
      setTeams(prev => [{ ...data, member_count: 0 }, ...prev])
      await logAudit(user?.id, 'Created team', name)
      addToast({ message: `Team "${name}" created.`, type: 'success' })
      setCreateOpen(false)
    }
    setBusy(false)
  }

  async function handleEdit({ name, game }) {
    setBusy(true)
    const { error } = await supabase
      .from('teams')
      .update({ name, game })
      .eq('id', editTarget.id)

    if (error) {
      addToast({ message: `Failed to update: ${error.message}`, type: 'danger' })
    } else {
      setTeams(prev => prev.map(t => t.id === editTarget.id ? { ...t, name, game } : t))
      await logAudit(user?.id, 'Edited team', name)
      addToast({ message: `Team "${name}" updated.`, type: 'success' })
      setEditTarget(null)
    }
    setBusy(false)
  }

  async function handleDeactivate() {
    setBusy(true)
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', deactTarget.id)

    if (error) {
      addToast({ message: `Failed to deactivate: ${error.message}`, type: 'danger' })
    } else {
      setTeams(prev => prev.map(t => t.id === deactTarget.id ? { ...t, is_active: false } : t))
      await logAudit(user?.id, 'Deactivated team', deactTarget.name)
      addToast({ message: `"${deactTarget.name}" deactivated. All members are blocked from login.`, type: 'success' })
      setDeactTarget(null)
    }
    setBusy(false)
  }

  async function handleActivate(team) {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: true })
      .eq('id', team.id)

    if (error) {
      addToast({ message: `Failed to activate: ${error.message}`, type: 'danger' })
    } else {
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, is_active: true } : t))
      await logAudit(user?.id, 'Activated team', team.name)
      addToast({ message: `"${team.name}" reactivated.`, type: 'success' })
    }
  }

  async function handleDelete() {
    setBusy(true)
    // DEBUG: delete cascades to tournaments and matches via FK ON DELETE CASCADE
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      addToast({ message: `Failed to delete: ${error.message}`, type: 'danger' })
    } else {
      setTeams(prev => prev.filter(t => t.id !== deleteTarget.id))
      await logAudit(user?.id, 'Deleted team', deleteTarget.name)
      addToast({ message: `"${deleteTarget.name}" permanently deleted.`, type: 'success' })
      setDeleteTarget(null)
    }
    setBusy(false)
  }

  // ── derived ────────────────────────────────────────────────

  const filtered = teams.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.game.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount   = teams.filter(t => t.is_active).length
  const inactiveCount = teams.filter(t => !t.is_active).length
  const totalMembers  = teams.reduce((acc, t) => acc + Number(t.member_count), 0)

  // ── render ─────────────────────────────────────────────────

  return (
    <DashboardLayout title="Teams">

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold mb-0.5" style={{ color: '#dde0ef', fontFamily: 'Syne, sans-serif' }}>
            Teams
          </h2>
          <p className="text-xs" style={{ color: '#555a78' }}>
            Create, configure, and manage team access.
          </p>
        </div>
        <button className="btn btn-primary text-xs" onClick={() => setCreateOpen(true)}>
          + New team
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total teams',    value: teams.length,   sub: 'registered' },
          { label: 'Active',         value: activeCount,    sub: 'can login' },
          { label: 'Total members',  value: totalMembers,   sub: 'across all teams' },
        ].map(k => (
          <div key={k.label} className="card animate-fade-up">
            <p className="text-xs mb-1" style={{ color: '#555a78' }}>{k.label}</p>
            <p className="text-2xl font-semibold font-mono" style={{ color: '#dde0ef' }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: '#3a3f5c' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <input
            className="form-input max-w-[220px]"
            placeholder="Search teams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            title="Refresh"
            onClick={fetchTeams}
            className="btn p-2"
            style={{ padding: '7px' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: '#555a78' }}>
            {inactiveCount > 0 && (
              <span
                className="badge"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}
              >
                {inactiveCount} inactive
              </span>
            )}
            <span>{filtered.length} team{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-10 text-center text-xs" style={{ color: '#555a78' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-xs" style={{ color: '#555a78' }}>
            {search ? 'No teams match your search.' : 'No teams yet. Create your first team above.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Team', 'Game', 'Members', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(team => (
                <tr key={team.id}>
                  <td className="table-td">
                    <p className="font-medium" style={{ color: '#dde0ef' }}>{team.name}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: '#3a3f5c' }}>{team.id}</p>
                  </td>

                  <td className="table-td">{team.game}</td>

                  <td className="table-td">
                    <span className="inline-flex items-center gap-1.5" style={{ color: '#7c80a0' }}>
                      <Users size={11} />
                      {team.member_count}
                    </span>
                  </td>

                  <td className="table-td">
                    <span className={`badge ${team.is_active ? 'badge-green' : 'badge-slate'}`}>
                      {team.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>

                  <td className="table-td" style={{ color: '#555a78' }}>
                    {new Date(team.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      {/* Edit */}
                      <button
                        className="btn text-xs py-1 px-2 gap-1"
                        onClick={() => setEditTarget(team)}
                        title="Edit team"
                      >
                        <Edit2 size={11} />
                        Edit
                      </button>

                      {/* Deactivate / Activate */}
                      {team.is_active ? (
                        <button
                          className="btn btn-danger text-xs py-1 px-2 gap-1"
                          onClick={() => setDeactTarget(team)}
                          title="Deactivate team"
                        >
                          <Power size={11} />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn btn-success text-xs py-1 px-2 gap-1"
                          onClick={() => handleActivate(team)}
                          title="Activate team"
                        >
                          <Power size={11} />
                          Activate
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        className="btn text-xs py-1 px-2"
                        onClick={() => setDeleteTarget(team)}
                        title="Delete team"
                        style={{ color: '#555a78' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <TeamFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={busy}
      />

      <TeamFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        team={editTarget}
        loading={busy}
      />

      <DeactivateModal
        open={!!deactTarget}
        onClose={() => setDeactTarget(null)}
        onConfirm={handleDeactivate}
        teamName={deactTarget?.name}
        loading={busy}
      />

      <DeleteTeamModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        team={deleteTarget}
        loading={busy}
      />
    </DashboardLayout>
  )
}