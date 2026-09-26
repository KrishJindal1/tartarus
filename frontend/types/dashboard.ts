export type ToneColor = 'sky' | 'slate' | 'blue' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose'

export type EndpointStatus = 'Healthy' | 'Degraded' | 'Down' | 'Warning' | 'Disarmed'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type EvasionTechnique =
  | 'Direct Syscall (SSN)'
  | 'In-Memory Reflective Injection'
  | 'BYOVD Callback Subversion'
  | 'Polymorphic LLVM Mutation'
  | 'Process Hollowing'
  | 'API Unhooking (ntdll)'

export type AVBypassStatus = 'Bypassed (0 Detections)' | 'Stealth Verified' | 'Heuristics Blinded'

export interface ForensicRecord {
  id: string
  targetNode: string
  targetOS: 'Windows Server 2022' | 'Windows 11 Enterprise' | 'Ubuntu 24.04 LTS' | 'Ubuntu 22.04 LTS'
  technique: EvasionTechnique
  avEvasionStatus: AVBypassStatus
  processContext: string
  pid: number
  collectedArtifact: string
  findingsCount: number
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
  details: {
    unhookedDlls: string[]
    memoryRegion: string
    driverCallbackTarget?: string
    mitigationAction: string
    rawSummary: string
  }
}

export interface ForensicJob {
  id: string
  scriptName: string
  target: string
  targetOS: string
  type: string
  started: string
  duration: string
  status: 'Completed' | 'Running' | 'Queued' | 'Failed'
  findings: string
  evasionStatus: 'Evaded' | 'Monitoring'
  avPresent: string
  command?: string
  outputLog?: string[]
}

export interface Endpoint {
  name: string
  agentId?: string
  hostname?: string
  ip?: string
  url: string
  method: HttpMethod
  status: EndpointStatus
  latency: string
  lastRun: string
  platform: string
  color: ToneColor
  technique?: EvasionTechnique
  avStatus?: AVBypassStatus
  avPresent?: string
  lastScript?: string
  evasionStatus?: 'Evaded' | 'Monitoring' | 'Bypassed'
}

export interface TimelineEvent {
  iconName: 'Check' | 'Upload' | 'AlertTriangle' | 'GitBranch' | 'Activity' | 'FileText'
  tone: ToneColor
  title: string
  detail: string
  time: string
  systemNode?: string
  evasionTechnique?: string
}

export interface MetricCard {
  label: string
  value: string
  sub: string
  iconName: string
  tone: ToneColor
  targetView?: string
}

export interface NavItem {
  label: string
  iconName: 'LayoutDashboard' | 'Server' | 'TerminalSquare' | 'Activity' | 'BarChart3' | 'FolderKanban' | 'FileText' | 'Clock3' | 'Cpu' | 'ShieldAlert'
  count?: number
  live?: boolean
}

export interface ScriptItem {
  name: string
  version: string
  lastDeployedOrDraft: string
  isDeployed: boolean
  technique: EvasionTechnique
  avBypassRate: string
  targetPlatforms: string[]
  mutationHash: string
  description: string
  sourceCode?: string
  irRepresentation?: string
  astStructure?: string
  targetFunctions?: string[]
}

export interface EvidenceItem {
  fileName: string
  captureTime: string
  size: string
  technique: EvasionTechnique
  targetNode: string
  avDetectionScore: '0/72 (Clean)'
  sha256: string
}

export interface ReportItem {
  id: string
  title: string
  targetCluster: string
  category: 'Forensic System Audit' | 'Polymorphic Evasion Report' | 'BYOVD Subversion Log' | 'Memory Integrity Review'
  executionTime: string
  avDetectionScore: string
  recordsExtracted: number
  criticalFindings: number
  status: 'Completed' | 'Ready for Review' | 'Archived'
  executiveSummary: string
  methodology: string
  evidenceArtifacts: string[]
  recommendations: string[]
}

export interface ViewCopyInfo {
  eyebrow: string
  title: string
  description: string
}
