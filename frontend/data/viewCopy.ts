import { ViewCopyInfo } from '@/types'

export const viewCopyData: Record<string, ViewCopyInfo> = {
  Endpoints: {
    eyebrow: 'API surface',
    title: 'Endpoints',
    description: 'Manage routes, owners, health checks, and response thresholds.',
  },
  'Deploy scripts': {
    eyebrow: 'Automation',
    title: 'Deploy scripts',
    description: 'Stage, review, and deploy repeatable test and monitoring scripts.',
  },
  'Live status': {
    eyebrow: 'Telemetry',
    title: 'Live status',
    description: 'Monitor active runs and production signals as they happen.',
  },
  Results: {
    eyebrow: 'Analysis',
    title: 'Results',
    description: 'Compare test outcomes, pass rates, latency, and open findings.',
  },
  Evidence: {
    eyebrow: 'Artifacts',
    title: 'Evidence',
    description: 'Review captured logs, payloads, screenshots, and supporting files.',
  },
  Reports: {
    eyebrow: 'Delivery',
    title: 'Reports',
    description: 'Create and share operational reports for your workspace.',
  },
  Timeline: {
    eyebrow: 'Audit trail',
    title: 'Timeline',
    description: 'Trace deployments, runs, findings, and workspace changes.',
  },
}
