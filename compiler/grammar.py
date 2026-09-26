"""
Grammar definitions, keywords, types, and standard forensic builtins.
"""

KEYWORDS = {
    "scan", "collect", "dump", "analyze", "exec", "return", "if", "else", "for", "in",
    "fn", "let", "use", "import", "target", "output", "encrypt", "log"
}

TYPES = {
    "Process", "Network", "Memory", "File", "Registry", "System", "Logon"
}

BUILTINS = {
    "collect_processes",
    "collect_network",
    "collect_files",
    "collect_logons",
    "collect_system",
    "dump_memory",
    "dump_registry",
    "analyze_persistence",
}
