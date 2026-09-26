import { ReportItem } from '@/types'

export const reportsData: ReportItem[] = [
  {
    id: 'RPT-FORENSIC-2026-01',
    title: 'Multi-Target System Deep Forensic Audit',
    targetCluster: 'Hybrid Windows & Ubuntu (us-east-prod-02, us-east-worker-09)',
    category: 'Forensic System Audit',
    executionTime: 'September 26, 2026 · 00:04 UTC',
    avDetectionScore: '0/72 Detections (100% AV Bypass)',
    recordsExtracted: 1842,
    criticalFindings: 3,
    status: 'Completed',
    executiveSummary:
      'Execution of JOCKY polymorphic scripts via direct syscalls and BYOVD driver callback subversion successfully extracted deep memory forensic state across target infrastructure without tripping user-mode hooks or kernel-level EDR heuristics.',
    methodology:
      '1. Go forensic agent compilation with dynamic signature mutation\n2. Encrypted Transport Relay on Port 443 TLS 1.3\n3. In-memory unhooking of ntdll.dll and reflective execution inside explorer.exe\n4. Kernel callback array inspection via legitimate signed driver handle',
    evidenceArtifacts: [
      'kernel_callback_table_dump.bin',
      'proc_mem_forensic_trace.json',
      'unhooked_ntdll_evidence.log',
      'evaded_av_telemetry_dump.json',
    ],
    recommendations: [
      'Isolate suspicious parent process PID 4192 on us-east-prod-02 due to unauthorized RWX memory allocation.',
      'Rotate local administrative service account credentials across Ubuntu nodes.',
      'Deploy scheduled polymorphic memory inspection every 6 hours via JOCKY CI/CD pipeline.',
    ],
  },
  {
    id: 'RPT-BYOVD-2026-02',
    title: 'Kernel Driver & EDR Callback Subversion Log',
    targetCluster: 'Windows Server 2022 (us-east-prod-02)',
    category: 'BYOVD Subversion Log',
    executionTime: 'September 25, 2026 · 23:45 UTC',
    avDetectionScore: '0/72 Detections (Clean Execution)',
    recordsExtracted: 614,
    criticalFindings: 1,
    status: 'Ready for Review',
    executiveSummary:
      'Detailed verification that legitimate vulnerable 3rd-party kernel drivers successfully enabled direct kernel structure inspection and blinded telemetry interception for deep memory acquisition.',
    methodology:
      'Loaded signed vulnerable driver to disarm EDR notification callbacks in PspCreateProcessNotifyRoutine, retrieved physical memory layout, and safely unloaded without kernel instability.',
    evidenceArtifacts: [
      'kernel_callback_table_dump.bin',
      'driver_handle_audit.log',
    ],
    recommendations: [
      'Audit existing vulnerable drivers on production image to prevent unauthorized adversary exploitation.',
      'Verify hypervisor-protected code integrity (HVCI) policies on production endpoints.',
    ],
  },
  {
    id: 'RPT-POLY-2026-03',
    title: 'Polymorphic Routine Mutation & Signature Neutralization',
    targetCluster: 'Ubuntu 24.04 & Ubuntu 22.04 LTS',
    category: 'Polymorphic Evasion Report',
    executionTime: 'September 25, 2026 · 22:15 UTC',
    avDetectionScore: '0/72 Detections (Signature Ineffective)',
    recordsExtracted: 928,
    criticalFindings: 0,
    status: 'Completed',
    executiveSummary:
      'Automated continuous delivery pipeline mutated intermediate representations, altered control-flow graphs, and randomized import tables for all forensic extraction routines with 100% heuristic bypass.',
    methodology:
      'Automated LLVM frontend transformation with variable encryption routines and dynamic syscall number (SSN) resolution at runtime.',
    evidenceArtifacts: [
      'evaded_av_telemetry_dump.json',
      'proc_mem_forensic_trace.json',
    ],
    recommendations: [
      'Adopt continuous polymorphic compilation cadence for all production telemetry agents.',
      'Maintain automated hash rotation schedule under 30 minutes.',
    ],
  },
]
