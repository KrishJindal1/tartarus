// Typed client for the Tartarus backend (FastAPI).
// Base URL: NEXT_PUBLIC_API_BASE_URL or http://127.0.0.1:8000.
// A JWT from localStorage is attached when present (AUTH_ENABLED=false dev
// mode works without a token).

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')

const TOKEN_KEY = 'tartarus_token'

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = window.localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = typeof body?.detail === 'string' ? body?.detail : JSON.stringify(body)
    } catch {
      detail = ''
    }
    throw new Error(detail ? `${path} → ${res.status}: ${detail}` : `${path} → HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) })
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeader(), cache: 'no-store' })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.blob()
}

// ---------------- backend payload shapes ----------------

export interface BackendAgent {
  agent_id: string
  hostname: string
  os: string
  architecture: string
  status: string
  av_present?: string | null
  agent_version?: string | null
  last_seen_at?: string | null
  registered_at?: string | null
}

export interface BackendScript {
  id: string
  name: string
  category: string
  jocky_source: string
  risk_level: string
  os_target: string
  is_predefined: boolean
  is_deployed: boolean
  version: number
  ir_sha256?: string | null
  created_at?: string | null
}

export interface BackendScriptDetail extends BackendScript {
  ir_bytes?: number[]
  ir_listing?: string
  ast_structure?: string
}

export interface BackendJob {
  id: string
  agent_id: string
  script_id: string
  status: string
  exec_mode: string
  ir_sha256?: string | null
  findings_summary?: string | null
  risk_score?: number | null
  created_at?: string
  dispatched_at?: string | null
  completed_at?: string | null
  created_by?: string | null
  // joined fields from GET /jobs/
  hostname?: string | null
  os?: string | null
  script_name?: string | null
}

export interface BackendJobDetail extends BackendJob {
  ir?: number[]
}

export interface BackendEvidenceRow {
  id: string
  job_id: string
  type: string
  data: unknown
  sha256?: string | null
  risk_score?: number | null
  collected_at?: string
  hostname?: string | null
}

export interface BackendReport {
  job_id: string
  title: string
  target: string
  os: string
  status: string
  risk_score: number
  evidence_count: number
  critical: number
  completed_at?: string | null
}

export interface EvidenceSummary {
  total_evidence: number
  by_type: Record<string, { count: number; avg_risk: number }>
  jobs_with_evidence: number
  max_risk: number
  avg_risk: number
  latest: BackendEvidenceRow | null
}

export interface CompileResult {
  ok: boolean
  error: string | null
  ir_listing?: string
  ir_bytes?: number[]
  ir_sha256?: string
  size?: number
  ast_structure?: string
}

export interface BackendResultRow {
  id: string
  job_id: string
  agent_id: string
  status: string
  message: string
  hostname: string | null
  os: string | null
  timestamp: string | null
  raw: string | null
  received_at: string | null
}

// ---------------- endpoint helpers ----------------

export const api = {
  listAgents: () => apiGet<BackendAgent[]>('/agents/'),
  deleteAgent: (agentId: string) => apiDelete<{ message: string }>(`/agents/${agentId}`),
  listScripts: () => apiGet<BackendScript[]>('/scripts/'),
  getScript: (id: string) => apiGet<BackendScriptDetail>(`/scripts/${id}`),
  compileScript: (jocky_source: string) =>
    apiPost<CompileResult>('/scripts/compile', { jocky_source }),
  createScript: (body: {
    name: string
    jocky_source: string
    category?: string
    risk_level?: string
    os_target?: string
  }) => apiPost<{ message: string; script: BackendScriptDetail }>('/scripts/', body),
  updateScript: (
    id: string,
    body: {
      name?: string
      jocky_source?: string
      category?: string
      risk_level?: string
      os_target?: string
    }
  ) => apiPut<{ message: string; script: BackendScriptDetail }>(`/scripts/${id}`, body),
  deleteScript: (id: string) => apiDelete<{ message: string }>(`/scripts/${id}`),
  listJobs: () => apiGet<BackendJob[]>('/jobs/'),
  getJob: (jobId: string) => apiGet<BackendJobDetail>(`/jobs/${jobId}`),
  createJob: (body: { agent_id: string; script_id: string; exec_mode?: string }) =>
    apiPost<{ message: string; job: BackendJob }>('/jobs/create', body),
  listEvidence: () => apiGet<BackendEvidenceRow[]>('/evidence/'),
  evidenceByJob: (jobId: string) => apiGet<BackendEvidenceRow[]>(`/evidence/${jobId}`),
  evidenceSummary: () => apiGet<EvidenceSummary>('/evidence/summary'),
  listReports: () => apiGet<BackendReport[]>('/reports/'),
  reportJson: (jobId: string) => apiGet<Record<string, unknown>>(`/reports/${jobId}/json`),
  reportPdfBlob: (jobId: string) => requestBlob(`/reports/${jobId}/pdf`),
  listResults: (jobId?: string) =>
    apiGet<BackendResultRow[]>(`/results/${jobId ? `?job_id=${jobId}` : ''}`),
  login: (email: string, password: string) =>
    apiPost<{ access_token: string; token_type: string }>('/auth/login', { email, password }),
}

// handy base for <a href> links (dev mode has no auth on static-ish GETs)
export const API_BASE = BASE
