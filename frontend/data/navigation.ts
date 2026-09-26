import { NavItem } from '@/types'

export const navItems: NavItem[] = [
  { label: 'Overview', iconName: 'LayoutDashboard' },
  { label: 'Endpoints', iconName: 'Server', count: 24 },
  { label: 'Deploy scripts', iconName: 'TerminalSquare' },
  { label: 'Live status', iconName: 'Activity', live: true },
  { label: 'Results', iconName: 'BarChart3' },
  { label: 'Evidence', iconName: 'FolderKanban', count: 18 },
  { label: 'Reports', iconName: 'FileText' },
  { label: 'Timeline', iconName: 'Clock3' },
]
