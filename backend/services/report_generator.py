"""
Report generator: aggregates job + evidence into an executive JSON report or
a formatted PDF (reportlab) with MITRE ATT&CK technique mappings.
"""

import json
from typing import Dict, List, Optional

from fastapi import HTTPException

from core import db

# Evidence type -> MITRE ATT&CK techniques relevant to the detection content
MITRE_MAP = {
    "process": ["T1055", "T1059"],          # Process Injection / Command & Scripting Interpreter
    "network": ["T1049", "T1071"],          # System Network Connections / Application Layer Protocol
    "memory": ["T1055", "T1218"],           # Process Injection / Signed Binary Proxy Execution
    "persistence": ["T1547", "T1053"],      # Boot/Logon Autostart / Scheduled Task
    "registry": ["T1112"],                  # Modify Registry
    "files": ["T1005", "T1070"],            # Data from Local System / Indicator Removal
    "system": ["T1082"],                    # System Information Discovery
    "logons": ["T1078", "T1110"],           # Valid Accounts / Brute Force
    "byovd": ["T1068", "T1543"],            # Exploitation for Privilege Escalation / System Service
}


def _load_job(job_id: str) -> Dict:
    job = db.query_one("SELECT * FROM jobs WHERE id = ?", (job_id,))
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _load_evidence(job_id: str) -> List[Dict]:
    rows = db.query("SELECT * FROM evidence WHERE job_id = ? ORDER BY collected_at ASC", (job_id,))
    for r in rows:
        try:
            r["data"] = json.loads(r["data"]) if isinstance(r.get("data"), str) else r["data"]
        except (ValueError, TypeError):
            r["data"] = {"raw": r.get("data")}
    return rows


def _build_report_dict(job_id: str) -> Dict:
    job = _load_job(job_id)
    agent = db.query_one("SELECT * FROM agents WHERE id = ?", (job["agent_id"],)) or {}
    evidence = _load_evidence(job_id)
    results = db.query("SELECT * FROM results WHERE job_id = ? ORDER BY received_at ASC", (job_id,))
    script = db.query_one("SELECT * FROM scripts WHERE id = ?", (job["script_id"],)) if job.get("script_id") else None

    findings: Dict[str, List] = {}
    techniques: List[str] = []
    for row in evidence:
        findings.setdefault(row["type"], []).append(row["data"])
        for t in MITRE_MAP.get(row["type"], []):
            if t not in techniques:
                techniques.append(t)

    timeline = [
        {"event": "job.created", "at": job["created_at"]},
    ]
    if job.get("dispatched_at"):
        timeline.append({"event": "job.dispatched", "at": job["dispatched_at"]})
    for r in results:
        timeline.append({"event": "result.received", "at": r.get("received_at"), "status": r.get("status")})
    if job.get("completed_at"):
        timeline.append({"event": "job.completed", "at": job["completed_at"]})

    evidence_summary = [
        {
            "type": row["type"],
            "sha256": row["sha256_hash"],
            "risk_score": row["risk_score"],
            "collected_at": row["collected_at"],
            "items": len(row["data"]) if isinstance(row["data"], list) else 1,
        }
        for row in evidence
    ]

    risk = float(job.get("risk_score") or 0.0)
    if risk >= 8:
        verdict, severity = "Critical indicators present - immediate review required", "CRITICAL"
    elif risk >= 5:
        verdict, severity = "High-risk findings detected", "HIGH"
    elif risk > 0:
        verdict, severity = "Moderate findings - monitor", "MEDIUM"
    else:
        verdict, severity = "No significant findings", "LOW"

    return {
        "report_type": "Tartarus Forensic System Audit",
        "job_id": job_id,
        "script": script["name"] if script else None,
        "agent": {
            "id": job["agent_id"],
            "hostname": agent.get("hostname", "unknown"),
            "os": agent.get("os_type", "unknown"),
            "agent_version": agent.get("agent_version"),
        },
        "exec_mode": job.get("exec_mode"),
        "status": job.get("status"),
        "ir_sha256": job.get("ir_sha256"),
        "risk_score": risk,
        "severity": severity,
        "verdict": verdict,
        "findings": findings,
        "evidence_summary": evidence_summary,
        "timeline": timeline,
        "mitre_techniques": techniques,
        "warnings": results[-1].get("message", "")[:500] if results else None,
        "generated_at": db.now_iso(),
    }


def generate_json_report(job_id: str) -> Dict:
    """Generate structured JSON forensic report."""
    return _build_report_dict(job_id)


def generate_pdf_report(job_id: str) -> bytes:
    """Generate compiled PDF forensic report with MITRE ATT&CK mapping."""
    from io import BytesIO

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    report = _build_report_dict(job_id)
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
        title=f"Tartarus Forensic Report {job_id[:8]}",
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], textColor=colors.HexColor("#0d1117"))
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, spaceBefore=10)
    body = styles["BodyText"]

    story = []
    story.append(Paragraph("Tartarus Framework — Forensic System Audit Report", h1))
    story.append(Paragraph("Issued for NTRO · Problem Statement 26148", body))
    story.append(Spacer(1, 6))

    meta = [
        ["Job ID", report["job_id"]],
        ["Script", report["script"] or "-"],
        ["Target", f'{report["agent"]["hostname"]} ({report["agent"]["os"]})'],
        ["Exec mode", report["exec_mode"] or "-"],
        ["Status", report["status"]],
        ["Risk score", f'{report["risk_score"]} / 10  ({report["severity"]})'],
        ["IR SHA-256", (report["ir_sha256"] or "-")[:32] + ("…" if report["ir_sha256"] and len(report["ir_sha256"]) > 32 else "")],
        ["Generated", report["generated_at"]],
    ]
    t = Table(meta, colWidths=[35 * mm, 125 * mm])
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d0d7de")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f6f8fa")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)

    story.append(Paragraph("Executive Summary", h2))
    story.append(Paragraph(report["verdict"], body))

    story.append(Paragraph("Evidence", h2))
    if report["evidence_summary"]:
        rows = [["Type", "Items", "Risk", "SHA-256", "Collected"]]
        for e in report["evidence_summary"]:
            rows.append([e["type"], str(e["items"]), f'{e["risk_score"]:.1f}', e["sha256"][:16] + "…", e["collected_at"][:19]])
        et = Table(rows, colWidths=[28 * mm, 16 * mm, 14 * mm, 55 * mm, 47 * mm])
        et.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d0d7de")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f6f8fa")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))
        story.append(et)
    else:
        story.append(Paragraph("No structured evidence rows recorded for this job.", body))

    story.append(Paragraph("MITRE ATT&CK Techniques", h2))
    story.append(Paragraph(", ".join(report["mitre_techniques"]) or "None mapped", body))

    story.append(Paragraph("Timeline", h2))
    for ev in report["timeline"]:
        story.append(Paragraph(f'• {ev["event"]} — {ev.get("at", "")}', body))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<i>Integrity: all evidence rows are SHA-256 hashed. "
        "Full machine-readable JSON is available at /reports/{job_id}/json.</i>",
        body,
    ))

    doc.build(story)
    return buf.getvalue()


def list_reports(limit: int = 50) -> List[Dict]:
    """Report summaries for completed jobs (drives the frontend Reports view)."""
    jobs = db.query(
        """SELECT j.*, a.hostname, a.os_type, s.name AS script_name
           FROM jobs j
           LEFT JOIN agents a ON a.id = j.agent_id
           LEFT JOIN scripts s ON s.id = j.script_id
           WHERE j.status IN ('completed','failed')
           ORDER BY j.completed_at DESC LIMIT ?""",
        (limit,),
    )
    out = []
    for job in jobs:
        ev = db.query("SELECT type, risk_score FROM evidence WHERE job_id = ?", (job["id"],))
        out.append({
            "job_id": job["id"],
            "title": f'{job.get("script_name") or "Custom script"} — {job.get("hostname") or job["agent_id"][:8]}',
            "target": job.get("hostname") or job["agent_id"][:8],
            "os": job.get("os_type") or "",
            "status": job["status"],
            "risk_score": job.get("risk_score") or 0,
            "evidence_count": len(ev),
            "critical": sum(1 for e in ev if (e.get("risk_score") or 0) >= 5),
            "completed_at": job.get("completed_at"),
        })
    return out
