import { useAuth } from './useAuth'

export function useRole() {
  const { role } = useAuth()
  return {
    role,
    isSuperAdmin:     role === 'super_admin',
    isTeamManager:    role === 'team_manager',
    isStaff:          role === 'staff',
    isPlayer:         role === 'player',
    canManageTeam:    ['super_admin', 'team_manager', 'staff'].includes(role),
    canViewAnalytics: role !== 'player',
  }
}
