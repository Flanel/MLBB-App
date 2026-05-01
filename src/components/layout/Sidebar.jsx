import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { NXKLogoMark } from '@/components/layout/NXKLogo'
import {
  LayoutDashboard, Users, Shield, ClipboardList, Settings,
  Swords, Trophy, BarChart2, UserCircle, History,
  LogOut, Calendar, TrendingUp, X, Link2, CheckSquare,
  UserCog, Zap, Flag, Star
} from 'lucide-react'

// Nav config statis — captain items di-inject secara dinamis di komponen
const navConfig = {
  super_admin: [
    { group:'Main', items:[
      { to:'/super-admin',           label:'Overview',      icon:LayoutDashboard },
      { to:'/super-admin/teams',     label:'Teams',         icon:Shield },
      { to:'/super-admin/users',     label:'Users',         icon:Users },
    ]},
    { group:'Management', items:[
      { to:'/super-admin/approvals', label:'Approvals',     icon:CheckSquare },
      { to:'/super-admin/invite',    label:'Invite Staff',  icon:Link2 },
    ]},
    { group:'System', items:[
      { to:'/super-admin/audit',     label:'Audit Log',     icon:ClipboardList },
      { to:'/super-admin/settings',  label:'Settings',      icon:Settings },
    ]},
    { group:'Account', items:[
      { to:'/topup',   label:'Top Up',       icon:Zap },
      { to:'/profile', label:'Profil Saya',  icon:UserCog },
    ]},
  ],
  team_manager: [
    { group:'Main', items:[
      { to:'/team-manager', label:'Dashboard', icon:LayoutDashboard },
    ]},
    { group:'Team', items:[
      { to:'/team-manager/roster',       label:'Roster',        icon:Users },
      { to:'/team-manager/team-lineup',  label:'Tim',           icon:Flag },
      { to:'/team-manager/matches',      label:'Match Input',   icon:Swords },
      { to:'/team-manager/tournaments',  label:'Tournaments',   icon:Trophy },
      { to:'/team-manager/schedule',     label:'Schedule',      icon:Calendar },
    ]},
    { group:'Reports', items:[
      { to:'/team-manager/analytics',    label:'Analytics',     icon:BarChart2 },
      { to:'/team-manager/winrate',      label:'Party Win Rate',icon:TrendingUp },
    ]},
    { group:'Player Mgmt', items:[
      { to:'/team-manager/invite',       label:'Invite Players',icon:Link2 },
      { to:'/team-manager/approvals',    label:'Approvals',     icon:CheckSquare },
    ]},
    { group:'Account', items:[
      { to:'/topup',   label:'Top Up',       icon:Zap },
      { to:'/profile', label:'Profil Saya',  icon:UserCog },
    ]},
  ],
  staff: [
    { group:'Main', items:[
      { to:'/team-manager',             label:'Dashboard',     icon:LayoutDashboard },
      { to:'/team-manager/roster',      label:'Roster',        icon:Users },
      { to:'/team-manager/team-lineup', label:'Tim',           icon:Flag },
      { to:'/team-manager/matches',     label:'Match Input',   icon:Swords },
      { to:'/team-manager/tournaments', label:'Tournaments',   icon:Trophy },
      { to:'/team-manager/schedule',    label:'Schedule',      icon:Calendar },
    ]},
    { group:'Player Mgmt', items:[
      { to:'/team-manager/invite', label:'Invite Players', icon:Link2 },
    ]},
    { group:'Account', items:[
      { to:'/topup',   label:'Top Up',       icon:Zap },
      { to:'/profile', label:'Profil Saya',  icon:UserCog },
    ]},
  ],
  player: [
    { group:'Main', items:[
      { to:'/player', label:'Dashboard', icon:UserCircle },
    ]},
    { group:'Stats', items:[
      { to:'/player/history',     label:'Match History', icon:History },
      { to:'/player/tournaments', label:'Tournaments',   icon:Trophy },
    ]},
    { group:'Team', items:[
      { to:'/player/team',     label:'Tim',      icon:Flag     },
      { to:'/player/schedule', label:'Schedule', icon:Calendar },
    ]},
    { group:'Account', items:[
      { to:'/topup',   label:'Top Up',       icon:Zap },
      { to:'/profile', label:'Profil Saya',  icon:UserCog },
    ]},
  ],
}

// Nav tambahan khusus captain — di-inject sebelum grup Account
const captainReportsGroup = {
  group: 'Captain Reports',
  items: [
    { to: '/player/analytics', label: 'Analytics Tim',    icon: BarChart2  },
    { to: '/player/winrate',   label: 'Party Win Rate',   icon: TrendingUp },
  ],
}

const roleLabels = {
  super_admin:'Super Admin', team_manager:'Team Manager',
  staff:'Staff', player:'Player',
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, role, isCaptain, signOut } = useAuth()

  // Inject captain reports group untuk player yang is_captain
  let groups = navConfig[role] || []
  if (role === 'player' && isCaptain) {
    const accountIdx = groups.findIndex(g => g.group === 'Account')
    groups = [
      ...groups.slice(0, accountIdx),
      captainReportsGroup,
      ...groups.slice(accountIdx),
    ]
  }

  const initials = (user?.email || 'NK').slice(0, 2).toUpperCase()

  return (
    <>
      {mobileOpen && (
        <div onClick={onMobileClose}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:30 }}
          className="mobile-backdrop"/>
      )}
      <aside className={`app-sidebar${mobileOpen?' open':''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ width:28, height:28, borderRadius:6, overflow:'hidden', flexShrink:0 }}>
            <NXKLogoMark size={28}/>
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:12, letterSpacing:'0.12em', color:'rgba(255,255,255,0.9)', lineHeight:1 }}>NXK</p>
            <p style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(255,255,255,0.32)', lineHeight:1, marginTop:2 }}>ESPORTS</p>
          </div>
          <button onClick={onMobileClose} className="sidebar-close-btn"
            style={{ marginLeft:'auto', background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:4, borderRadius:4, display:'none' }}>
            <X size={15}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {groups.map(group => (
            <div key={group.group}>
              <p className="sidebar-group-label" style={{
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {group.group === 'Captain Reports' && (
                  <Star size={9} style={{ color: 'rgba(251,191,36,0.7)', flexShrink:0 }}/>
                )}
                {group.group}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                {group.items.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink key={item.to} to={item.to}
                      end={['/team-manager','/player','/super-admin'].includes(item.to)}
                      className={({ isActive }) => `sidebar-item${isActive?' active':''}`}
                      onClick={onMobileClose}>
                      <Icon size={14} strokeWidth={1.75} style={{ flexShrink:0, opacity:0.8 }}/>
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ width:26, height:26, borderRadius:6, background:'rgba(225,29,72,0.25)', border:'1px solid rgba(225,29,72,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#f87171', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <p style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.72)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
              {role === 'player' && isCaptain && (
                <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.3)', color:'#fbbf24', fontWeight:600, flexShrink:0 }}>
                  KAPTEN
                </span>
              )}
            </div>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:1 }}>{roleLabels[role]||role}</p>
          </div>
          <button onClick={signOut} title="Keluar"
            style={{ flexShrink:0, padding:6, borderRadius:6, background:'transparent', border:'none', color:'rgba(255,255,255,0.28)', cursor:'pointer', transition:'all 0.12s' }}
            onMouseEnter={e=>{ e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(225,29,72,0.15)' }}
            onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.28)'; e.currentTarget.style.background='transparent' }}>
            <LogOut size={13} strokeWidth={1.75}/>
          </button>
        </div>
      </aside>
    </>
  )
}