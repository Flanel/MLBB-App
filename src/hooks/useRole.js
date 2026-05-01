import { useAuth } from './useAuth'

export function useRole() {
  const { role, isCaptain } = useAuth()
  return {
    role,
    isCaptain:        isCaptain === true,
    isSuperAdmin:     role === 'super_admin',
    isTeamManager:    role === 'team_manager',
    isStaff:          role === 'staff',
    isPlayer:         role === 'player',
    canManageTeam:    ['super_admin', 'team_manager', 'staff'].includes(role),
    // Captain bisa lihat analytics tim sendiri (read-only)
    canViewAnalytics: role !== 'player' || isCaptain === true,
  }
}
