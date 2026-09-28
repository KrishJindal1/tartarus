# JOCKY / Tartarus - Windows agent installer (x64). Works on ANY Windows 10+
# machine with internet access, regardless of network (agents reach the backend
# over its public URL). Safe to re-run; idempotent unless -Force.
#
# Quick install (from any machine, PowerShell):
#   iwr https://raw.githubusercontent.com/himkarr/tartarus/main/agent/install/install-windows.ps1 -OutFile i.ps1
#   .\i.ps1 -C2 https://YOUR-BACKEND.onrender.com
#
# Options:
#   -C2 <url>         backend base URL (required), e.g. https://xxx.onrender.com
#   -AgentId <uuid>   reuse a fixed agent id (default: generate once, persist)
#   -InstallDir <p>   install dir (default: %LOCALAPPDATA%\jocky-agent)
#   -Source <u|path>  binary source (default: GitHub raw releases/)
#   -Autostart        logon autostart (scheduled task; HKCU Run key fallback)
#   -NoStart          install but don't start
#   -Force            re-download binary & regenerate key
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$C2,
  [string]$AgentId = "",
  [string]$InstallDir = "$env:LOCALAPPDATA\jocky-agent",
  [string]$Source = "https://raw.githubusercontent.com/himkarr/tartarus/main/releases/tartarus-win-amd64.exe",
  [switch]$Autostart,
  [switch]$NoStart,
  [switch]$Force
)
$ErrorActionPreference = "Stop"

if ($env:PROCESSOR_ARCHITECTURE -ne "AMD64") {
  throw "Published binaries are x64 (amd64) only (this machine: $env:PROCESSOR_ARCHITECTURE)."
}
$C2 = $C2.TrimEnd("/")

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$exe = Join-Path $InstallDir "tartarus-agent.exe"
$key = Join-Path $InstallDir "agent.pem"
$idfile = Join-Path $InstallDir "agent.id"

# -- binary --
if ((Test-Path $exe) -and -not $Force) {
  Write-Host "==> binary already present, keeping (use -Force to re-download)"
} elseif ($Source -match '^https?://') {
  Write-Host "==> downloading agent binary"
  Invoke-WebRequest -Uri $Source -OutFile $exe -UseBasicParsing
} else {
  Copy-Item $Source $exe -Force
}
if ((Get-Item $exe).Length -lt 1MB) { throw "binary missing/too small: $exe" }

# downloaded/copied files may carry a Mark-of-the-Web zone tag that some
# application-control policies treat as untrusted
try { Unblock-File -Path $exe -ErrorAction Stop } catch { }

# -- RSA key --
if (-not (Test-Path $key) -or $Force) {
  Write-Host "==> generating RSA key (requires built-in ssh-keygen)"
  if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
    throw "ssh-keygen not found - install 'OpenSSH Client' (Settings > Apps > Optional features)."
  }
  # -Force must not leave ssh-keygen prompting "Overwrite (y/n)?" - remove the
  # old key first so generation stays non-interactive.
  if (Test-Path $key) { Remove-Item -Force $key }
  & ssh-keygen -q -t rsa -b 2048 -m PEM -N '""' -f $key
  if ($LASTEXITCODE -ne 0) { throw "ssh-keygen failed (exit $LASTEXITCODE)" }
  if (Test-Path "$key.pub") { Remove-Item "$key.pub" }
}

# -- agent id (persisted so re-runs keep the same identity) --
if (-not $AgentId) {
  if (Test-Path $idfile) { $AgentId = (Get-Content $idfile -Raw).Trim() }
  else { $AgentId = [guid]::NewGuid().ToString(); Set-Content -Path $idfile -Value $AgentId }
} else {
  Set-Content -Path $idfile -Value $AgentId
}

# -- pre-check backend --
Write-Host "==> backend pre-check: $C2/health"
try {
  $h = Invoke-RestMethod -Uri "$C2/health" -TimeoutSec 8
  Write-Host "    backend: $($h.status)"
} catch {
  throw "backend unreachable at $C2/health - deploy the backend first (see README deploy steps)."
}

# -- start script --
$bat = Join-Path $InstallDir "start-agent.bat"
@"
@echo off
rem JOCKY agent ($AgentId)
"$exe" -agent-id $AgentId -c2 $C2 -privkey "$key"
"@ | Set-Content -Path $bat -Encoding ASCII

# -- optional autostart (logon) --
# Preferred: a scheduled task. Registering a task usually needs elevation, so
# when that fails we fall back to HKCU Run (works for any signed-in user).
if ($Autostart) {
  $autostartVia = ""
  Write-Host "==> registering logon autostart"
  try {
    $action = New-ScheduledTaskAction -Execute $bat
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName "JOCKY Agent" -Action $action -Trigger $trigger -Force -ErrorAction Stop | Out-Null
    $autostartVia = "scheduled task 'JOCKY Agent'"
  } catch {
    $runCmd = '"' + $bat + '"'
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" `
      -Name "JOCKY Agent" -Value $runCmd
    $autostartVia = "HKCU Run key 'JOCKY Agent'"
    Write-Host "    scheduled task unavailable without elevation; used Run key instead"
  }
  Write-Host "    autostart via: $autostartVia"
}

# -- start --
if (-not $NoStart) {
  Write-Host "==> starting agent"
  Start-Process -FilePath $exe -WorkingDirectory $InstallDir `
    -ArgumentList @("-agent-id", $AgentId, "-c2", $C2, "-privkey", $key)
  Start-Sleep -Seconds 3
  if (-not (Get-Process -Name "tartarus-agent" -ErrorAction SilentlyContinue)) {
    throw @"
agent process did not start - Windows likely blocked the binary.
If you saw 'Application Control policy has blocked this file', Smart App
Control or Code Integrity flagged this file. Run 'Unblock-File $exe' and
inspect: Get-WinEvent -LogName Microsoft-Windows-CodeIntegrity/Operational -MaxEvents 5
"@
  }
}

# -- verify --
Write-Host "==> verifying registration"
try {
  $agents = Invoke-RestMethod -Uri "$C2/agents/" -TimeoutSec 8
  $me = @($agents) | Where-Object { $_.agent_id -eq $AgentId }
  if ($me) { Write-Host "SUCCESS: agent $AgentId is ONLINE ($($me.hostname) / $($me.os))" -ForegroundColor Green }
  else { Write-Warning "agent not visible yet - check the agent console window"; exit 1 }
} catch { Write-Warning "verification failed: $_"; exit 1 }

Write-Host @"

Installed: $exe
  id:       $AgentId
  c2:       $C2
  start:    $bat        (double-click)
  stop:     taskkill /IM tartarus-agent.exe /F
  autostart: $(if ($Autostart) { $autostartVia } else { "not configured - re-run with -Autostart" })
"@ -ForegroundColor Cyan
