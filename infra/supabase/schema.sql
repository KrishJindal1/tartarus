-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (Forensic Investigators & Analysts)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text CHECK (role IN ('admin', 'analyst', 'viewer')) DEFAULT 'analyst',
  allowed_agents uuid[] DEFAULT '{}',
  mfa_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- AGENTS (Registered Host Endpoints)
CREATE TYPE os_type AS ENUM ('windows', 'linux');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy', 'idle');

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostname text NOT NULL,
  os_type os_type NOT NULL,
  ip_internal text,
  public_key text NOT NULL, -- RSA-2048 public key PEM
  status agent_status DEFAULT 'offline',
  av_present text,
  agent_version text DEFAULT '1.0.0',
  last_seen_at timestamptz DEFAULT now(),
  registered_at timestamptz DEFAULT now()
);

-- SCRIPTS (Predefined + Custom Forensic Routines)
CREATE TYPE script_category AS ENUM ('memory','network','process','persistence','registry','files','system','logons');
CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
CREATE TYPE os_target AS ENUM ('windows','linux','both');

CREATE TABLE scripts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category script_category NOT NULL,
  jocky_source text NOT NULL, -- raw .jky source code
  compiled_ir bytea,          -- cached compiled IR
  risk_level risk_level DEFAULT 'medium',
  os_target os_target DEFAULT 'both',
  is_predefined boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- JOBS (Forensic Investigation Dispatches)
CREATE TYPE job_status AS ENUM ('queued','dispatched','executing','completed','failed');
CREATE TYPE exec_mode AS ENUM ('user_mode','kernel_mode');

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  script_id uuid REFERENCES scripts(id),
  r2_payload_key text, -- R2 object key for encrypted payload
  r2_result_key text,  -- R2 object key for encrypted result
  enc_aes_key text,    -- AES key encrypted with agent pubkey (base64)
  status job_status DEFAULT 'queued',
  exec_mode exec_mode DEFAULT 'user_mode',
  findings_summary text,
  risk_score float DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

-- EVIDENCE (Parsed Forensic Findings per Job)
CREATE TYPE evidence_type AS ENUM ('process','network','memory','persistence','registry','files','system','logons');

CREATE TABLE evidence (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  data jsonb NOT NULL, -- structured findings
  sha256_hash text NOT NULL,
  risk_score float DEFAULT 0,
  r2_result_key text,
  collected_at timestamptz DEFAULT now()
);

-- AUDIT LOGS (Immutable Security and Activity Ledger)
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Realtime subscriptions for dashboard updates
ALTER TABLE jobs REPLICA IDENTITY FULL;
ALTER TABLE evidence REPLICA IDENTITY FULL;
