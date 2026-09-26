"""
AST Parser for the JOCKY forensic DSL.
"""
from typing import List, Any
from .lexer import Token


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0

    def parse(self) -> Any:
        """Parse token stream into an Abstract Syntax Tree."""
        raise NotImplementedError("Parser not implemented yet")
