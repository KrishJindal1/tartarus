"""
Router for managing JOCKY forensic scripts (source, IR inspection, staging).
"""

import hashlib
import json
import os
import sys
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core import db
from core.security import current_user, require_role
from services import audit_logger
from services.polymorphic import mutate_source

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from compiler.ir_emitter import format_ir  # noqa: E402
from compiler.parser import parse  # noqa: E402

router = APIRouter()


class ScriptCreate(BaseModel):
    name: str
    jocky_source: str
    category: str = "system"
    risk_level: str = "medium"
    os_target: str = "both"


class ScriptCompile(BaseModel):
    jocky_source: str


class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    jocky_source: Optional[str] = None
    category: Optional[str] = None
    risk_level: Optional[str] = None
    os_target: Optional[str] = None


def _serialize(row: dict, include_ir: bool = False) -> dict:
    ir = row.get("compiled_ir")
    ir_bytes = bytes(ir) if isinstance(ir, (bytes, bytearray)) else (bytes(ir) if ir else b"")
    out = {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "jocky_source": row["jocky_source"],
        "risk_level": row["risk_level"],
        "os_target": row["os_target"],
        "is_predefined": bool(row.get("is_predefined")),
        "is_deployed": bool(row.get("is_deployed")),
        "version": row.get("version", 1),
        "ir_sha256": row.get("ir_sha256"),
        "created_at": row.get("created_at"),
    }
    if include_ir and ir_bytes:
        out["ir_bytes"] = list(ir_bytes)
        out["ir_listing"] = format_ir(ir_bytes)
        try:
            tree = parse(row["jocky_source"])
            out["ast_structure"] = _ast_summary(tree)
        except Exception as exc:
            out["ast_structure"] = f"<parse error: {exc}>"
    return out


def _ast_summary(node, depth: int = 0) -> str:
    """Compact textual AST for the frontend inspector."""
    from compiler.parser import Binary, Call, ExprStmt, FnDecl, If, Ident, Let, Literal, Output, Program, Unary

    pad = "  " * depth
    if isinstance(node, Program):
        parts = [_ast_summary(s, depth) for s in node.stmts]
        parts += [_ast_summary(f, depth) for f in node.functions]
        return "\n".join(p for p in parts if p)
    if isinstance(node, FnDecl):
        body = "\n".join(_ast_summary(s, depth + 1) for s in node.body)
        return f"{pad}FnDecl {node.name}({', '.join(node.params)})\n{body}"
    if isinstance(node, Let):
        return f"{pad}Let {node.name} =\n{_ast_summary(node.expr, depth + 1)}"
    if isinstance(node, Output):
        return f"{pad}Output\n{_ast_summary(node.expr, depth + 1)}"
    if isinstance(node, If):
        out = f"{pad}If\n{_ast_summary(node.cond, depth + 1)}\n{pad}Then\n"
        out += "\n".join(_ast_summary(s, depth + 2) for s in node.then_body)
        if node.else_body:
            out += f"\n{pad}Else\n" + "\n".join(_ast_summary(s, depth + 2) for s in node.else_body)
        return out
    if isinstance(node, ExprStmt):
        return f"{pad}ExprStmt\n{_ast_summary(node.expr, depth + 1)}"
    if isinstance(node, Call):
        args = ", ".join(_ast_summary(a, 0) for a in node.args)
        return f"{pad}Call {node.name}({args})"
    if isinstance(node, Binary):
        return f"{pad}Binary {node.op}\n{_ast_summary(node.left, depth + 1)}\n{_ast_summary(node.right, depth + 1)}"
    if isinstance(node, Unary):
        return f"{pad}Unary {node.op}\n{_ast_summary(node.operand, depth + 1)}"
    if isinstance(node, Ident):
        return f"{pad}Ident {node.name}"
    if isinstance(node, Literal):
        return f"{pad}Literal {node.value!r}"
    return f"{pad}{type(node).__name__}"


@router.get("/")
def list_scripts():
    """List available forensic scripts."""
    rows = db.query("SELECT * FROM scripts ORDER BY is_predefined DESC, name ASC")
    return [_serialize(r) for r in rows]


@router.post("/")
def create_script(body: ScriptCreate, request: Request, user=Depends(require_role("admin", "analyst"))):
    """Stage a new JOCKY script: validates compilation + polymorphic hashing."""
    try:
        ir, sha = mutate_source(body.jocky_source)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"JOCKY compile error: {exc}")

    script_id = str(uuid4())
    db.execute(
        """INSERT INTO scripts (id, name, category, jocky_source, compiled_ir, ir_sha256,
             risk_level, os_target, is_predefined, is_deployed, version, created_by, created_at)
           VALUES (?,?,?,?,?,?,?,?,0,1,1,?,?)""",
        (script_id, body.name, body.category, body.jocky_source, ir, sha,
         body.risk_level, body.os_target, user.get("sub"), db.now_iso()),
    )
    audit_logger.log_action(user.get("sub"), "script.create", "script", script_id,
                            ip_address=request.client.host if request.client else None,
                            metadata={"name": body.name, "ir_sha256": sha})
    return {"message": "Script staged", "script": _serialize(db.query_one("SELECT * FROM scripts WHERE id=?", (script_id,)), include_ir=True)}


@router.post("/compile")
def compile_dry_run(body: ScriptCompile):
    """Dry-run compile for the IDE: no save, returns IR listing + AST or the error."""
    try:
        ir, sha = mutate_source(body.jocky_source)
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
    try:
        tree = parse(body.jocky_source)
        ast_structure = _ast_summary(tree)
    except Exception as exc:  # pragma: no cover - mutate_source already parsed
        return {"ok": False, "error": f"AST error: {exc}"}
    return {
        "ok": True,
        "error": None,
        "ir_listing": format_ir(ir),
        "ir_bytes": list(ir),
        "ir_sha256": sha,
        "size": len(ir),
        "ast_structure": ast_structure,
    }


@router.put("/{script_id}")
def update_script(script_id: str, body: ScriptUpdate, request: Request, user=Depends(require_role("admin", "analyst"))):
    """Save edits to a script: recompiles (polymorphic), bumps version."""
    row = db.query_one("SELECT * FROM scripts WHERE id = ?", (script_id,))
    if row is None:
        row = db.query_one("SELECT * FROM scripts WHERE name = ?", (script_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Script not found")
    if row.get("is_predefined"):
        raise HTTPException(status_code=403, detail="Predefined scripts are read-only (use Save as new)")

    name = body.name if body.name is not None else row["name"]
    category = body.category if body.category is not None else row["category"]
    risk_level = body.risk_level if body.risk_level is not None else row["risk_level"]
    os_target = body.os_target if body.os_target is not None else row["os_target"]
    source = body.jocky_source if body.jocky_source is not None else row["jocky_source"]

    try:
        ir, sha = mutate_source(source)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"JOCKY compile error: {exc}")

    version = int(row.get("version") or 1) + 1
    db.execute(
        """UPDATE scripts SET name=?, jocky_source=?, category=?, risk_level=?, os_target=?,
             compiled_ir=?, ir_sha256=?, version=? WHERE id=?""",
        (name, source, category, risk_level, os_target, ir, sha, version, row["id"]),
    )
    audit_logger.log_action(user.get("sub"), "script.update", "script", row["id"],
                            ip_address=request.client.host if request.client else None,
                            metadata={"name": name, "version": version, "ir_sha256": sha})
    return {"message": "Script saved", "script": _serialize(
        db.query_one("SELECT * FROM scripts WHERE id=?", (row["id"],)), include_ir=True)}


@router.delete("/{script_id}")
def delete_script(script_id: str, request: Request, user=Depends(require_role("admin", "analyst"))):
    """Remove a user-created script (predefined scripts are protected)."""
    row = db.query_one("SELECT * FROM scripts WHERE id = ?", (script_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Script not found")
    if row.get("is_predefined"):
        raise HTTPException(status_code=403, detail="Predefined scripts cannot be deleted")
    db.execute("DELETE FROM scripts WHERE id = ?", (script_id,))
    audit_logger.log_action(user.get("sub"), "script.delete", "script", script_id,
                            ip_address=request.client.host if request.client else None,
                            metadata={"name": row["name"]})
    return {"message": "Script deleted"}


@router.get("/{script_id}")
def get_script(script_id: str):
    """Retrieve script source + Go-AST-style inspection + IR listing."""
    row = db.query_one("SELECT * FROM scripts WHERE id = ?", (script_id,))
    if row is None:
        row = db.query_one("SELECT * FROM scripts WHERE name = ?", (script_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="Script not found")
    out = _serialize(row, include_ir=True)
    out["ir_sha256"] = out.get("ir_sha256") or (
        hashlib.sha256(bytes(row.get("compiled_ir") or b"")).hexdigest() if row.get("compiled_ir") else None
    )
    return out
