import { NavItem } from '@/types'

export const navItems: NavItem[] = [
  { label: 'Overview', href: '/', iconName: 'LayoutDashboard' },
  { label: 'Agents', href: '/agents', iconName: 'Server', badgeKey: 'agents' },
  { label: 'Scripts', href: '/scripts', iconName: 'TerminalSquare', badgeKey: 'scripts' },
  { label: 'Jobs', href: '/jobs', iconName: 'Activity', badgeKey: 'jobs' },
  { label: 'Evidence', href: '/evidence', iconName: 'FolderKanban', badgeKey: 'evidence' },
  { label: 'Reports', href: '/reports', iconName: 'FileText', badgeKey: 'reports' },
]
