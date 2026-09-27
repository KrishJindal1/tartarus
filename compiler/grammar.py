"""
Grammar definitions, keywords, types, and standard forensic builtins for the
JOCKY forensic DSL.
"""

KEYWORDS = {
    "scan", "collect", "dump", "analyze", "exec", "return", "if", "else", "for", "in",
    "fn", "let", "use", "import", "target", "output", "encrypt", "log",
    "true", "false",
}

TYPES = {
    "Process", "Network", "Memory", "File", "Registry", "Driver", "System", "Logon",
}

# Standard forensic builtins. Each maps to an IR opcode at emission time.
BUILTINS = {
    "collect_processes": "COLLECT",
    "collect_network": "COLLECT",
    "collect_files": "COLLECT",
    "collect_logons": "COLLECT",
    "collect_system": "COLLECT",
    "dump_memory": "DUMP",
    "dump_registry": "DUMP",
    "analyze_persistence": "ANALYZE",
    "scan_byovd": "BYOVD",
    "exec_hollow": "EXEC",
    "exec_direct_syscall": "EXEC",
    "encrypt": "ENCRYPT",
    "log": "LOG",
}

# Operators supported by the expression grammar.
OPERATORS = {"==", "!=", "<=", ">=", "<", ">", "+", "-", "*", "/", "&&", "||", "!"}
