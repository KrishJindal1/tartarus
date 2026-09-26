"""
Lexer/tokenizer for the JOCKY forensic DSL.
"""
from typing import List


class TokenType:
    KEYWORD = "KEYWORD"
    IDENT = "IDENT"
    BUILTIN = "BUILTIN"
    STRING = "STRING"
    NUMBER = "NUMBER"
    PUNCT = "PUNCT"
    EOF = "EOF"


class Token:
    def __init__(self, type_: str, value, line: int):
        self.type = type_
        self.value = value
        self.line = line


class Lexer:
    def __init__(self, source: str):
        self.src = source
        self.pos = 0
        self.line = 1

    def tokenize(self) -> List[Token]:
        """Convert DSL source string into a list of tokens."""
        raise NotImplementedError("Lexer not implemented yet")
