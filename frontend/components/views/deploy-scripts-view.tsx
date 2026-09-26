'use client'

import React, { useState } from 'react'
import {
  Upload,
  Code2,
  ShieldCheck,
  Binary,
  Cpu,
  CheckCircle2,
  Terminal,
  FileCode2,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { Card, useToast } from '@/components/ui'
import { DestinationViewShell } from './destination-view-shell'
import { ImportScriptModal, GuardrailPolicyModal } from '@/components/modals'
import { ScriptItem } from '@/types'

interface DeployScriptsViewProps {
  scripts: ScriptItem[]
  selectedScriptName?: string | null
  onRun: () => void
  onExport: () => void
  onToggleDeploy: (name: string) => void
  onImportScript: (script: ScriptItem) => void
}

export function DeployScriptsView({
  scripts,
  selectedScriptName,
  onRun,
  onExport,
  onToggleDeploy,
  onImportScript,
}: DeployScriptsViewProps) {
  const { toast } = useToast()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  const [selectedScriptForInspect, setSelectedScriptForInspect] = useState<ScriptItem>(() => {
    if (selectedScriptName) {
      const found = scripts.find((s) => s.name === selectedScriptName || s.name.includes(selectedScriptName))
      if (found) return found
    }
    return scripts[0]
  })
  const [activeCodeTab, setActiveCodeTab] = useState<'dsl' | 'ast' | 'ir'>('dsl')

  React.useEffect(() => {
    if (selectedScriptName) {
      const found = scripts.find((s) => s.name === selectedScriptName || s.name.includes(selectedScriptName))
      if (found) {
        setSelectedScriptForInspect(found)
      }
    }
  }, [selectedScriptName, scripts])

  const [policy, setPolicy] = useState({
    peerReview: true,
    autoSmoke: true,
    rollbackKeep: true,
  })

  const handleToggle = (script: ScriptItem) => {
    onToggleDeploy(script.name)
    if (script.isDeployed) {
      toast(`Rolled back script "${script.name}" to draft buffer.`, 'info')
    } else {
      toast(`Deployed polymorphic script "${script.name} (${script.version})" with 100% AV evasion!`, 'success')
    }
  }

  const handleImport = (newScript: ScriptItem) => {
    onImportScript(newScript)
    toast(`Imported JOCKY polymorphic script "${newScript.name}" into library.`, 'success')
  }

  const handleSavePolicy = (newPolicy: typeof policy) => {
    setPolicy(newPolicy)
    toast('Deployment guardrail policies updated successfully.', 'success')
  }

  const buttonClass =
    'rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors shadow-2xs'

  return (
    <>
      <DestinationViewShell name="Deploy scripts" onRun={onRun} onExport={onExport}>
        <div className="flex flex-col gap-6">
          {/* Interactive JOCKEY Script IDE & Compiler Pipeline */}
          <Card className="overflow-hidden border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex flex-col gap-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                  Go Forensic Routine Compiler & Execution Inspector (Go → SSA)
                </h3>
                <span className="rounded bg-[#ddf4ff] dark:bg-[#388bfd]/15 border border-[#54aeff]/40 dark:border-[#388bfd]/30 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0969da] dark:text-[#58a6ff]">
                  {selectedScriptForInspect?.name || 'jockey-core-forensics.go'}
                </span>
              </div>

              {/* Code Stage Switcher: Go Source / AST / SSA */}
              <div className="flex items-center gap-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] p-1 rounded-md text-xs border border-[#d0d7de] dark:border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('dsl')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    activeCodeTab === 'dsl'
                      ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                      : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  1. Go Source (.go)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('ast')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    activeCodeTab === 'ast'
                      ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                      : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  2. Go AST Tree
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('ir')}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    activeCodeTab === 'ir'
                      ? 'bg-[#1f883d] dark:bg-[#238636] text-white shadow-xs'
                      : 'text-[#656d76] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  3. Go SSA / Execution Stream
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] divide-y lg:divide-y-0 lg:divide-x divide-[#d0d7de] dark:divide-[#30363d]">
              {/* Left Code Editor Display */}
              <div className="bg-[#0d1117] p-4 font-mono text-xs text-[#e6edf3] overflow-x-auto">
                <div className="flex items-center justify-between text-[11px] text-[#8b949e] pb-2 mb-2 border-b border-[#30363d]">
                  <span>Go Editor · Runtime: JOCKEY Go Engine v2.4</span>
                  <span className="text-[#3fb950] font-bold">● Validated Go Package</span>
                </div>

                {activeCodeTab === 'dsl' && (
                  <pre className="text-[#7ee787] leading-relaxed">
                    {selectedScriptForInspect?.sourceCode || `// JOCKEY Forensic Script v2.4
collect system
collect processes
collect network
collect files "/var/log"
analyze persistence
generate report`}
                  </pre>
                )}

                {activeCodeTab === 'ast' && (
                  <pre className="text-[#79c0ff] leading-relaxed">
                    {selectedScriptForInspect?.astStructure || `ProgramStructure {
  Statements: [
    CollectStmt(Target: "system"),
    CollectStmt(Target: "processes"),
    CollectStmt(Target: "network"),
    CollectFilesStmt(Path: "/var/log"),
    AnalyzeStmt(Type: "persistence"),
    ReportStmt(Format: "standard_evidence")
  ]
}`}
                  </pre>
                )}

                {activeCodeTab === 'ir' && (
                  <pre className="text-[#d2a8ff] leading-relaxed">
                    {selectedScriptForInspect?.irRepresentation || `// Jocky IR (Platform Independent Intermediate Representation)
%0 = call_builtin @jocky.collect.system()
%1 = call_builtin @jocky.collect.process_tree()
%2 = call_builtin @jocky.collect.active_sockets()
%3 = call_builtin @jocky.collect.filesystem_path(str "/var/log")
%4 = call_builtin @jocky.analyze.persistence_artifacts(%0, %1)
%5 = call_builtin @jocky.report.synthesize(%0, %1, %2, %3, %4)
ret void`}
                  </pre>
                )}
              </div>

              {/* Right Compiler & Execution Target Summary */}
              <div className="bg-[#f6f8fa] dark:bg-[#161b22] p-4 flex flex-col justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs uppercase tracking-wider mb-2">
                    Compiler & Agent Layer
                  </h4>

                  <div className="flex flex-col gap-2">
                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Lexer & Parser</span>
                      <p className="font-semibold text-[#1f2328] dark:text-[#e6edf3] text-[11px] mt-0.5">Tokenize & AST Validation</p>
                      <p className="text-[10px] text-[#656d76] dark:text-[#8b949e]">Zero standard MSVC/GCC artifacts generated</p>
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Execution Engine</span>
                      <p className="font-semibold text-[#8250df] dark:text-[#d2a8ff] text-[11px] mt-0.5">Golang Function Registry</p>
                      <p className="text-[10px] text-[#656d76] dark:text-[#8b949e]">Cross-platform in-memory dispatch</p>
                    </div>

                    <div className="rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5">
                      <span className="text-[10px] uppercase font-bold text-[#656d76] dark:text-[#8b949e]">Target Platforms</span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {selectedScriptForInspect?.targetPlatforms?.map((p) => (
                          <span key={p} className="rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.5 text-[10px] font-semibold text-[#1f2328] dark:text-[#c9d1d9]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Script Library Grid */}
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card>
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] p-4 bg-white dark:bg-[#161b22]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      JOCKEY Polymorphic Script Library
                    </h3>
                    <span className="rounded-full bg-[#dafbe1] dark:bg-[#238636]/20 border border-[#4ac26b]/40 dark:border-[#238636]/40 text-[#1a7f37] dark:text-[#3fb950] px-2 py-0.5 text-[10px] font-bold">
                      Continuous CI/CD Delivery
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e]">
                    Self-mutating intermediate representations (LLVM IR) bypassing static signatures & behavioral heuristics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="size-3.5" /> Stage New Script
                </button>
              </div>

              <div className="flex flex-col gap-3.5 p-4">
                {scripts.map((script) => {
                  const isSelected = selectedScriptForInspect?.name === script.name

                  return (
                    <div
                      key={script.name}
                      onClick={() => setSelectedScriptForInspect(script)}
                      className={`rounded-xl border p-4 transition-all shadow-2xs flex flex-col gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#8c959f] dark:border-[#8b949e] bg-[#eaeef2] dark:bg-[#21262d]'
                          : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                              script.isDeployed
                                ? 'bg-[#dafbe1] dark:bg-[#238636]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/40 dark:border-[#238636]/40'
                                : 'bg-[#fbefff] dark:bg-[#8250df]/20 text-[#8250df] dark:text-[#d2a8ff] border border-[#d8b9ff]/60 dark:border-[#8250df]/40'
                            }`}
                          >
                            <Binary className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                                {script.name}
                              </p>
                              <span className="text-xs font-mono font-bold text-[#0969da] dark:text-[#58a6ff] bg-[#ddf4ff] dark:bg-[#388bfd]/15 px-2 py-0.5 rounded border border-[#54aeff]/40 dark:border-[#388bfd]/30">
                                {script.version}
                              </span>
                              <span className="text-[10px] font-mono text-[#656d76] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] px-1.5 py-0.5 rounded">
                                MD5: {script.mutationHash}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#656d76] dark:text-[#8b949e] leading-relaxed">
                              {script.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggle(script)
                          }}
                          className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs border cursor-pointer shrink-0 ${
                            script.isDeployed
                              ? 'border-[#d4a72c]/50 bg-[#fff8c5] dark:bg-[#d29922]/15 text-[#9a6700] dark:text-[#d29922] hover:bg-[#fcf3b8]'
                              : 'border-transparent bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white'
                          }`}
                        >
                          {script.isDeployed ? 'Rollback' : 'Deploy Script'}
                        </button>
                      </div>

                      {/* Metadata footer */}
                      <div className="flex items-center justify-between border-t border-[#d0d7de]/60 dark:border-[#30363d] pt-2.5 text-[11px] text-[#656d76] dark:text-[#8b949e] flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-1">
                            <CheckCircle2 className="size-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                            {script.avBypassRate}
                          </span>
                          <span className="font-mono text-[#8250df] dark:text-[#d2a8ff] font-semibold">
                            {script.technique}
                          </span>
                        </div>
                        <span className="font-mono text-[#656d76] dark:text-[#8b949e]">{script.lastDeployedOrDraft}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                  <ShieldCheck className="size-4 text-[#0969da] dark:text-[#58a6ff]" />
                  <h3>Polymorphic Guardrails & CI/CD</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#656d76] dark:text-[#8b949e]">
                  Continuous delivery pipeline guardrails ensuring all JOCKY intermediate code iterations are randomized, tested in memory, and reversible.
                </p>

                <div className="mt-4 flex flex-col gap-3 text-xs text-[#656d76] dark:text-[#8b949e]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        policy.peerReview ? 'bg-[#1a7f37] dark:bg-[#3fb950]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                      }`}
                    />
                    <span
                      className={
                        policy.peerReview
                          ? 'text-[#1f2328] dark:text-[#e6edf3] font-medium'
                          : 'text-[#656d76] dark:text-[#8b949e] line-through'
                      }
                    >
                      Require cryptographic review before production rollout
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        policy.autoSmoke ? 'bg-[#1a7f37] dark:bg-[#3fb950]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                      }`}
                    />
                    <span
                      className={
                        policy.autoSmoke
                          ? 'text-[#1f2328] dark:text-[#e6edf3] font-medium'
                          : 'text-[#656d76] dark:text-[#8b949e] line-through'
                      }
                    >
                      Automatically execute in-memory unhooked smoke suite
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        policy.rollbackKeep ? 'bg-[#1a7f37] dark:bg-[#3fb950]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                      }`}
                    />
                    <span
                      className={
                        policy.rollbackKeep
                          ? 'text-[#1f2328] dark:text-[#e6edf3] font-medium'
                          : 'text-[#656d76] dark:text-[#8b949e] line-through'
                      }
                    >
                      Maintain zero-downtime rollback memory buffer
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPolicyOpen(true)}
                className={`mt-6 w-full ${buttonClass} py-2 text-center font-bold text-[#1f2328] dark:text-[#c9d1d9] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] cursor-pointer`}
              >
                Edit Guardrail Policies
              </button>
            </Card>
          </section>
        </div>
      </DestinationViewShell>

      <ImportScriptModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />

      <GuardrailPolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        onSave={handleSavePolicy}
      />
    </>
  )
}
