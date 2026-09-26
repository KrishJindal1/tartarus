import { ScriptItem } from '@/types'

export const scriptsData: ScriptItem[] = [
  {
    name: 'mem_dump.go',
    version: 'v2.4.1',
    lastDeployedOrDraft: 'Last deployed 1m ago',
    isDeployed: true,
    technique: 'In-Memory Reflective Injection',
    avBypassRate: '100% (0 Detections)',
    targetPlatforms: ['Windows 11 Enterprise', 'Windows Server 2022', 'Ubuntu 22.04 LTS'],
    mutationHash: '9a8f2c61e4b09',
    description: 'Volatile memory extraction routine that traverses Virtual Address Descriptors (VAD) with zero disk footprint.',
    sourceCode: `// mem_dump.go - JOCKEY In-Memory VAD Forensic Dump Engine
package main

import (
	"context"
	"jockey/mem"
	"jockey/telemetry"
	"jockey/crypto"
)

func ExecuteInvestigation(ctx context.Context) error {
	vadDescriptors := mem.TraverseVADTree()
	rawHeapDump := mem.CaptureProcessHeap(ctx)
	sealedEvidence := crypto.SealStream(vadDescriptors, rawHeapDump)
	
	return telemetry.TransmitSealedEvidence(ctx, sealedEvidence)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["context", "jockey/mem", "jockey/telemetry", "jockey/crypto"],
  FuncDecl: "ExecuteInvestigation(ctx context.Context) error",
  CallStack: [
    CallExpr: "mem.TraverseVADTree()",
    CallExpr: "mem.CaptureProcessHeap(ctx)",
    CallExpr: "crypto.SealStream(vadDescriptors, rawHeapDump)",
    ReturnStmt: "telemetry.TransmitSealedEvidence(ctx, sealedEvidence)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - mem_dump.go
b1:
  v1 = StaticCall <[]VADDescriptor> @mem.TraverseVADTree()
  v2 = StaticCall <[]byte> @mem.CaptureProcessHeap(v0)
  v3 = StaticCall <*SealedPayload> @crypto.SealStream(v1, v2)
  v4 = StaticCall <error> @telemetry.TransmitSealedEvidence(v0, v3)
  Return v4`,
    targetFunctions: ['mem.TraverseVADTree', 'mem.CaptureProcessHeap', 'crypto.SealStream', 'telemetry.TransmitSealedEvidence'],
  },
  {
    name: 'proc_hollow_scan.go',
    version: 'v2.3.0',
    lastDeployedOrDraft: 'Last deployed 4m ago',
    isDeployed: true,
    technique: 'Process Hollowing',
    avBypassRate: '98.6% (0 Detections)',
    targetPlatforms: ['Windows 11 Enterprise', 'Windows Server 2022'],
    mutationHash: 'c74f9d21e8a01',
    description: 'Scans processes for hollowed PE headers and unaligned entry points with pipe handle correlation.',
    sourceCode: `// proc_hollow_scan.go - Process Hollowing & Injection Inspector
package main

import (
	"context"
	"jockey/pe"
	"jockey/handles"
	"jockey/telemetry"
)

func ScanProcessHollowing(ctx context.Context) error {
	anomalies := pe.VerifyBaseAddressAlignment()
	pipes := handles.ScanNamedPipes()
	
	findings := pe.CorrelateC2Descriptors(anomalies, pipes)
	return telemetry.EmitRecord("proc_hollowing_telemetry", findings)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["context", "jockey/pe", "jockey/handles", "jockey/telemetry"],
  FuncDecl: "ScanProcessHollowing(ctx context.Context) error",
  CallStack: [
    CallExpr: "pe.VerifyBaseAddressAlignment()",
    CallExpr: "handles.ScanNamedPipes()",
    CallExpr: "pe.CorrelateC2Descriptors(anomalies, pipes)",
    ReturnStmt: "telemetry.EmitRecord('proc_hollowing_telemetry', findings)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - proc_hollow_scan.go
b1:
  v1 = StaticCall <[]PEAnomaly> @pe.VerifyBaseAddressAlignment()
  v2 = StaticCall <[]PipeHandle> @handles.ScanNamedPipes()
  v3 = StaticCall <*FindingSet> @pe.CorrelateC2Descriptors(v1, v2)
  v4 = StaticCall <error> @telemetry.EmitRecord(str "proc_hollowing_telemetry", v3)
  Return v4`,
    targetFunctions: ['pe.VerifyBaseAddressAlignment', 'handles.ScanNamedPipes', 'pe.CorrelateC2Descriptors', 'telemetry.EmitRecord'],
  },
  {
    name: 'kernel_enum.go',
    version: 'v2.4.1',
    lastDeployedOrDraft: 'Last deployed 8m ago',
    isDeployed: true,
    technique: 'BYOVD Callback Subversion',
    avBypassRate: '100% (0 Detections)',
    targetPlatforms: ['Windows Server 2022', 'Windows 10 Pro'],
    mutationHash: 'b44f2c81e9d10',
    description: 'Go BYOVD kernel inspector that probes kernel driver handles, callbacks, and physical memory structures.',
    sourceCode: `// kernel_enum.go - Kernel Callback Routine Enumerator
package main

import (
	"jockey/win/wdk"
	"jockey/telemetry"
)

func InspectKernelState() error {
	callbacks := wdk.QueryKernelCallbacks()
	stack := wdk.InspectDriverStack("fltmgr.sys")
	unhooked := wdk.VerifyUnhookedSyscalls()
	
	return telemetry.EmitRecord("kernel_integrity", callbacks, stack, unhooked)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["jockey/win/wdk", "jockey/telemetry"],
  FuncDecl: "InspectKernelState() error",
  CallStack: [
    CallExpr: "wdk.QueryKernelCallbacks()",
    CallExpr: "wdk.InspectDriverStack('fltmgr.sys')",
    CallExpr: "wdk.VerifyUnhookedSyscalls()",
    ReturnStmt: "telemetry.EmitRecord('kernel_integrity', ...)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - kernel_enum.go
b1:
  v1 = StaticCall <[]CallbackEntry> @wdk.QueryKernelCallbacks()
  v2 = StaticCall <*DriverStack> @wdk.InspectDriverStack(str "fltmgr.sys")
  v3 = StaticCall <bool> @wdk.VerifyUnhookedSyscalls()
  v4 = StaticCall <error> @telemetry.EmitRecord(str "kernel_integrity", v1, v2, v3)
  Return v4`,
    targetFunctions: ['wdk.QueryKernelCallbacks', 'wdk.InspectDriverStack', 'wdk.VerifyUnhookedSyscalls', 'telemetry.EmitRecord'],
  },
  {
    name: 'registry_forensic.go',
    version: 'v2.1.0',
    lastDeployedOrDraft: 'Last deployed 12m ago',
    isDeployed: true,
    technique: 'Direct Syscall (SSN)',
    avBypassRate: '96.1% (0 Detections)',
    targetPlatforms: ['Windows Server 2022', 'Windows 10 Enterprise'],
    mutationHash: 'd88a1b90f4e32',
    description: 'Direct registry hive parser that detects hidden null-byte Run keys and extracts ShimCache artifacts.',
    sourceCode: `// registry_forensic.go - Direct Registry Hive Inspection
package main

import (
	"jockey/registry"
	"jockey/telemetry"
)

func AuditRegistryPersistence() error {
	runKeys := registry.ScanNullByteKeys("HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run")
	shimCache := registry.ParseShimCache()
	
	return telemetry.EmitRecord("registry_persistence", runKeys, shimCache)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["jockey/registry", "jockey/telemetry"],
  FuncDecl: "AuditRegistryPersistence() error",
  CallStack: [
    CallExpr: "registry.ScanNullByteKeys(...)",
    CallExpr: "registry.ParseShimCache()",
    ReturnStmt: "telemetry.EmitRecord('registry_persistence', ...)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - registry_forensic.go
b1:
  v1 = StaticCall <[]KeyEntry> @registry.ScanNullByteKeys(str "HKLM\\Software...")
  v2 = StaticCall <[]ShimRecord> @registry.ParseShimCache()
  v3 = StaticCall <error> @telemetry.EmitRecord(str "registry_persistence", v1, v2)
  Return v3`,
    targetFunctions: ['registry.ScanNullByteKeys', 'registry.ParseShimCache', 'telemetry.EmitRecord'],
  },
  {
    name: 'net_pcap.go',
    version: 'v2.2.0',
    lastDeployedOrDraft: 'Last deployed 18m ago',
    isDeployed: true,
    technique: 'Polymorphic LLVM Mutation',
    avBypassRate: '100% (0 Detections)',
    targetPlatforms: ['Ubuntu 22.04 LTS', 'Ubuntu 24.04 LTS', 'Windows 11 Enterprise'],
    mutationHash: 'e99c3d40a1b88',
    description: 'Live memory socket stream auditor capturing high-entropy DNS tunneling channels without driver alerts.',
    sourceCode: `// net_pcap.go - Socket & DNS Tunneling Analyzer
package main

import (
	"context"
	"jockey/net"
	"jockey/telemetry"
)

func CaptureVolatileTraffic(ctx context.Context) error {
	rawRing := net.OpenRawSocketBuffer()
	dnsBursts := net.AnalyzeEntropy(rawRing)
	
	return telemetry.EmitRecord("dns_tunneling_telemetry", dnsBursts)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["context", "jockey/net", "jockey/telemetry"],
  FuncDecl: "CaptureVolatileTraffic(ctx context.Context) error",
  CallStack: [
    CallExpr: "net.OpenRawSocketBuffer()",
    CallExpr: "net.AnalyzeEntropy(rawRing)",
    ReturnStmt: "telemetry.EmitRecord('dns_tunneling_telemetry', dnsBursts)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - net_pcap.go
b1:
  v1 = StaticCall <*RawBuffer> @net.OpenRawSocketBuffer()
  v2 = StaticCall <[]EntropyBurst> @net.AnalyzeEntropy(v1)
  v3 = StaticCall <error> @telemetry.EmitRecord(str "dns_tunneling_telemetry", v2)
  Return v3`,
    targetFunctions: ['net.OpenRawSocketBuffer', 'net.AnalyzeEntropy', 'telemetry.EmitRecord'],
  },
  {
    name: 'api_unhook.go',
    version: 'v2.5.0',
    lastDeployedOrDraft: 'Last deployed 22m ago',
    isDeployed: true,
    technique: 'API Unhooking (ntdll)',
    avBypassRate: '100% (0 Detections)',
    targetPlatforms: ['Windows 11 Enterprise', 'Windows 10 Pro'],
    mutationHash: 'a12b44c88e991',
    description: 'Restores hooked API trampolines in ntdll.dll from clean disk image and resolves dynamic SSNs.',
    sourceCode: `// api_unhook.go - Native Syscall Unhooking & Gate Restorer
package main

import (
	"jockey/sys"
	"jockey/telemetry"
)

func RestoreUnhookedSyscalls() error {
	restoredHooks := sys.RestoreNtdllTrampolines()
	ssnMap := sys.ResolveDynamicSSNs()
	
	return telemetry.EmitRecord("unhooked_gate_telemetry", restoredHooks, ssnMap)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["jockey/sys", "jockey/telemetry"],
  FuncDecl: "RestoreUnhookedSyscalls() error",
  CallStack: [
    CallExpr: "sys.RestoreNtdllTrampolines()",
    CallExpr: "sys.ResolveDynamicSSNs()",
    ReturnStmt: "telemetry.EmitRecord('unhooked_gate_telemetry', ...)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - api_unhook.go
b1:
  v1 = StaticCall <int> @sys.RestoreNtdllTrampolines()
  v2 = StaticCall <map[string]uint32> @sys.ResolveDynamicSSNs()
  v3 = StaticCall <error> @telemetry.EmitRecord(str "unhooked_gate_telemetry", v1, v2)
  Return v3`,
    targetFunctions: ['sys.RestoreNtdllTrampolines', 'sys.ResolveDynamicSSNs', 'telemetry.EmitRecord'],
  },
  {
    name: 'direct_syscall.go',
    version: 'v2.4.0',
    lastDeployedOrDraft: 'Last deployed 28m ago',
    isDeployed: true,
    technique: 'Direct Syscall (SSN)',
    avBypassRate: '100% (0 Detections)',
    targetPlatforms: ['Ubuntu 22.04 LTS', 'Ubuntu 24.04 LTS'],
    mutationHash: 'e7b20a399f11d',
    description: 'File-less Linux and Windows direct kernel syscall dispatcher bypassing all userland hooks.',
    sourceCode: `// direct_syscall.go - Zero-Footprint Kernel Gate Dispatcher
package main

import (
	"jockey/sys"
	"jockey/telemetry"
)

func DispatchDirectSyscall() error {
	gate := sys.InitDirectKernelGate()
	telemetryData := gate.HarvestKernelPids()
	
	return telemetry.EmitRecord("direct_syscall_harvest", telemetryData)
}`,
    astStructure: `GoPackageAST {
  Package: "main",
  Imports: ["jockey/sys", "jockey/telemetry"],
  FuncDecl: "DispatchDirectSyscall() error",
  CallStack: [
    CallExpr: "sys.InitDirectKernelGate()",
    CallExpr: "gate.HarvestKernelPids()",
    ReturnStmt: "telemetry.EmitRecord('direct_syscall_harvest', ...)"
  ]
}`,
    irRepresentation: `// JOCKEY SSA Form - direct_syscall.go
b1:
  v1 = StaticCall <*KernelGate> @sys.InitDirectKernelGate()
  v2 = MethodCall <[]KernelPid> v1.HarvestKernelPids()
  v3 = StaticCall <error> @telemetry.EmitRecord(str "direct_syscall_harvest", v2)
  Return v3`,
    targetFunctions: ['sys.InitDirectKernelGate', 'gate.HarvestKernelPids', 'telemetry.EmitRecord'],
  },
]
