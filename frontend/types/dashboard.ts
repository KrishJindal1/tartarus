export type ToneColor = 'sky' | 'slate' | 'blue' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose'

export interface AgentView {
  agentId: string
  hostname: string
  os: string
  architecture: string
  status: string
  avPresent: string | null
  agentVersion: string | null
  lastSeenAt: string | null
  registeredAt: string | null
  jobCount: number
  runningJobs: number
}

export interface ScriptView {
  id: string
  name: string
  category: string
  riskLevel: string
  osTarget: string
  isPredefined: boolean
  isDeployed: boolean
  version: number
  irSha256: string | null
  source: string
  description: string
  createdAt: string | null
}

export type JobStatus = 'queued' | 'dispatched' | 'executing' | 'completed' | 'failed'

export interface JobView {
  id: string
  shortId: string
  scriptId: string
  scriptName: string
  agentId: string
  hostname: string
  os: string
  status: JobStatus
  execMode: string
  irSha256: string | null
  findingsSummary: string | null
  riskScore: number | null
  createdAt: string | null
  dispatchedAt: string | null
  completedAt: string | null
  started: string
  duration: string
}

export interface EvidenceView {
  id: string
  jobId: string
  type: string
  sha256: string | null
  riskScore: number | null
  collectedAt: string | null
  hostname: string | null
  size: number
  data: unknown
}

export interface ReportView {
  jobId: string
  title: string
  target: string
  os: string
  status: string
  riskScore: number
  evidenceCount: number
  critical: number
  completedAt: string | null
}

export interface MetricCard {
  label: string
  value: string
  sub: string
  iconName: string
  tone: ToneColor
  href: string
}

export type BadgeKey = 'agents' | 'scripts' | 'jobs' | 'evidence' | 'reports'

export interface NavItem {
  label: string
  href: string
  iconName: string
  badgeKey?: BadgeKey
}
