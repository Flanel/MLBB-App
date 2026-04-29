import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/router/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

import LoginPage           from '@/pages/auth/LoginPage'
import InviteRegisterPage  from '@/pages/register/InviteRegisterPage'
import ProfilePage         from '@/pages/profile/ProfilePage'
import TopUpPage           from '@/pages/topup/TopUpPage'

import SAOverviewPage  from '@/pages/dashboard/super-admin/OverviewPage'
import TeamsPage       from '@/pages/dashboard/super-admin/TeamsPage'
import UsersPage       from '@/pages/dashboard/super-admin/UsersPage'
import AuditPage       from '@/pages/dashboard/super-admin/AuditPage'
import SettingsPage    from '@/pages/dashboard/super-admin/SettingsPage'
import SAInvitePage    from '@/pages/dashboard/super-admin/InvitePage'
import SAApprovalsPage from '@/pages/dashboard/super-admin/ApprovalsPage'
import TeamDataPage    from '@/pages/dashboard/super-admin/TeamDataPage'

import TmDashboard    from '@/pages/dashboard/team-manager/DashboardPage'
import RosterPage     from '@/pages/dashboard/team-manager/RosterPage'
import TeamLineupPage from '@/pages/dashboard/team-manager/TeamLineupPage'
import MatchesPage    from '@/pages/dashboard/team-manager/MatchesPage'
import TmTournaments  from '@/pages/dashboard/team-manager/TournamentsPage'
import AnalyticsPage  from '@/pages/dashboard/team-manager/AnalyticsPage'
import WinRatePage    from '@/pages/dashboard/team-manager/WinRatePage'
import TmSchedulePage from '@/pages/dashboard/team-manager/SchedulePage'
import TmInvitePage   from '@/pages/dashboard/team-manager/InvitePage'
import TmApprovalsPage from '@/pages/dashboard/team-manager/ApprovalsPage'

import PlayerDashboard    from '@/pages/dashboard/player/DashboardPage'
import HistoryPage        from '@/pages/dashboard/player/HistoryPage'
import PlayerTournaments  from '@/pages/dashboard/player/TournamentsPage'
import PlayerSchedulePage from '@/pages/dashboard/player/SchedulePage'
import PlayerTeamPage     from '@/pages/dashboard/player/TeamPage'

const SA  = ['super_admin']
const TMS = ['super_admin','team_manager','staff']
const TM  = ['super_admin','team_manager']
const ALL = ['super_admin','team_manager','staff','player']

function DashboardRedirect() {
  const { role, loading } = useAuth()
  if (loading || !role) return null
  const map = { super_admin:'/super-admin', team_manager:'/team-manager', staff:'/team-manager', player:'/player' }
  return <Navigate to={map[role]||'/super-admin'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register/:token" element={<InviteRegisterPage />} />
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={ALL}><DashboardRedirect /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute allowedRoles={ALL}><ProfilePage /></ProtectedRoute>} />
        <Route path="/topup"     element={<ProtectedRoute allowedRoles={ALL}><TopUpPage /></ProtectedRoute>} />

        <Route path="/super-admin"                    element={<ProtectedRoute allowedRoles={SA}><SAOverviewPage /></ProtectedRoute>} />
        <Route path="/super-admin/teams"              element={<ProtectedRoute allowedRoles={SA}><TeamsPage /></ProtectedRoute>} />
        <Route path="/super-admin/users"              element={<ProtectedRoute allowedRoles={SA}><UsersPage /></ProtectedRoute>} />
        <Route path="/super-admin/audit"              element={<ProtectedRoute allowedRoles={SA}><AuditPage /></ProtectedRoute>} />
        <Route path="/super-admin/settings"           element={<ProtectedRoute allowedRoles={SA}><SettingsPage /></ProtectedRoute>} />
        <Route path="/super-admin/invite"             element={<ProtectedRoute allowedRoles={SA}><SAInvitePage /></ProtectedRoute>} />
        <Route path="/super-admin/approvals"          element={<ProtectedRoute allowedRoles={SA}><SAApprovalsPage /></ProtectedRoute>} />
        <Route path="/super-admin/teams/:teamId/data" element={<ProtectedRoute allowedRoles={SA}><TeamDataPage /></ProtectedRoute>} />

        <Route path="/team-manager"              element={<ProtectedRoute allowedRoles={TMS}><TmDashboard /></ProtectedRoute>} />
        <Route path="/team-manager/roster"       element={<ProtectedRoute allowedRoles={TMS}><RosterPage /></ProtectedRoute>} />
        <Route path="/team-manager/team-lineup"  element={<ProtectedRoute allowedRoles={TMS}><TeamLineupPage /></ProtectedRoute>} />
        <Route path="/team-manager/matches"      element={<ProtectedRoute allowedRoles={TMS}><MatchesPage /></ProtectedRoute>} />
        <Route path="/team-manager/tournaments"  element={<ProtectedRoute allowedRoles={TMS}><TmTournaments /></ProtectedRoute>} />
        <Route path="/team-manager/analytics"    element={<ProtectedRoute allowedRoles={TMS}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/team-manager/winrate"      element={<ProtectedRoute allowedRoles={TMS}><WinRatePage /></ProtectedRoute>} />
        <Route path="/team-manager/schedule"     element={<ProtectedRoute allowedRoles={TMS}><TmSchedulePage /></ProtectedRoute>} />
        <Route path="/team-manager/invite"       element={<ProtectedRoute allowedRoles={TMS}><TmInvitePage /></ProtectedRoute>} />
        <Route path="/team-manager/approvals"    element={<ProtectedRoute allowedRoles={TM}><TmApprovalsPage /></ProtectedRoute>} />

        <Route path="/player"             element={<ProtectedRoute allowedRoles={ALL}><PlayerDashboard /></ProtectedRoute>} />
        <Route path="/player/history"     element={<ProtectedRoute allowedRoles={ALL}><HistoryPage /></ProtectedRoute>} />
        <Route path="/player/tournaments" element={<ProtectedRoute allowedRoles={ALL}><PlayerTournaments /></ProtectedRoute>} />
        <Route path="/player/schedule"    element={<ProtectedRoute allowedRoles={ALL}><PlayerSchedulePage /></ProtectedRoute>} />
        <Route path="/player/team"        element={<ProtectedRoute allowedRoles={ALL}><PlayerTeamPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}