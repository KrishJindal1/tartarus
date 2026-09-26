import { MetricCard } from '@/types'

export const metricsData: MetricCard[] = [
  {
    label: 'Active Endpoints',
    value: '24 / 24',
    sub: 'Last heartbeat 3s ago',
    iconName: 'Server',
    tone: 'emerald',
    targetView: 'Endpoints',
  },
  {
    label: 'Scripts Deployed',
    value: '142',
    sub: 'Go Forensic Routines (.go)',
    iconName: 'TerminalSquare',
    tone: 'sky',
    targetView: 'Deploy scripts',
  },
  {
    label: 'Forensic Jobs',
    value: '7 running',
    sub: '3 queued · In-memory',
    iconName: 'Activity',
    tone: 'cyan',
    targetView: 'Results',
  },
  {
    label: 'AV Evasion Rate',
    value: '99.3%',
    sub: '2,840 samples (0 detections)',
    iconName: 'ShieldCheck',
    tone: 'emerald',
    targetView: 'Live status',
  },
  {
    label: 'Kernel Callbacks',
    value: '18',
    sub: 'Suppressed & disarmed',
    iconName: 'Cpu',
    tone: 'slate',
    targetView: 'Evidence',
  },
  {
    label: 'Tunnel Uptime',
    value: '99.97%',
    sub: 'Encrypted Relay (TLS 1.3)',
    iconName: 'Radar',
    tone: 'violet',
    targetView: 'Endpoints',
  },
]
