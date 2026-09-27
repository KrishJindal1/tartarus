"""
JOCKY lexer: tokenizes DSL source into a token stream.

Supports: line comments (#), string literals (with escapes), integers,
identifiers, keywords, builtins, dotted names (system.info) are produced by
the parser from IDENT DOT IDENT, and all punctuation/operators.
"""

from dataclasses import dataclass
from enum import Enum, auto
from typing import List

from compiler.grammar import KEYWORDS, BUILTINS


class TokenType(Enum):
    IDENTIFIER = auto()
    KEYWORD = auto()
    BUILTIN = auto()
    NUMBER = auto()
    STRING = auto()
    PUNCT = auto()
    EOF = auto()


# Longest-match first so "==" wins over "=".
_PUNCT = [
    "==", "!=", "<=", ">=", "&&", "||",
    "(", ")", "{", "}", "[", "]", ".", ",", ";", ":", "=",
    "<", ">", "+", "-", "*", "/", "!", "&", "|",
]


@dataclass
class Token:
    type: TokenType
    value: object
    position: int

    @property
    def name(self) -> str:
        return self.type.name


class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.position = 0
        self.line = 1

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []
        src = self.source
        n = len(src)

        while self.position < n:
            ch = src[self.position]

            if ch.isspace():
                if ch == "\n":
                    self.line += 1
                self.position += 1
                continue

            # Line comment
            if ch == "#":
                while self.position < n and src[self.position] != "\n":
                    self.position += 1
                continue

            # String literal
            if ch == '"':
                start = self.position
                self.position += 1
                out = []
                while self.position < n and src[self.position] != '"':
                    c = src[self.position]
                    if c == "\\" and self.position + 1 < n:
                        self.position += 1
                        esc = src[self.position]
                        out.append({"n": "\n", "t": "\t", '"': '"', "\\": "\\"}.get(esc, esc))
                    else:
                        out.append(c)
                    self.position += 1
                if self.position >= n:
                    raise SyntaxError(f"Unterminated string at position {start}")
                self.position += 1  # closing quote
                tokens.append(Token(TokenType.STRING, "".join(out), start))
                continue

            # Number literal
            if ch.isdigit():
                start = self.position
                while self.position < n and src[self.position].isdigit():
                    self.position += 1
                tokens.append(Token(TokenType.NUMBER, int(src[start:self.position]), start))
                continue

            # Identifier / keyword / builtin
            if ch.isalpha() or ch == "_":
                start = self.position
                while self.position < n and (src[self.position].isalnum() or src[self.position] == "_"):
                    self.position += 1
                value = src[start:self.position]
                if value in KEYWORDS:
                    tokens.append(Token(TokenType.KEYWORD, value, start))
                elif value in BUILTINS:
                    tokens.append(Token(TokenType.BUILTIN, value, start))
                else:
                    tokens.append(Token(TokenType.IDENTIFIER, value, start))
                continue

            # Punctuation / operators (longest match)
            matched = False
            for p in _PUNCT:
                if src.startswith(p, self.position):
                    tokens.append(Token(TokenType.PUNCT, p, self.position))
                    self.position += len(p)
                    matched = True
                    break
            if matched:
                continue

            raise SyntaxError(f"Unexpected character '{ch}' at line {self.line} position {self.position}")

        tokens.append(Token(TokenType.EOF, None, self.position))
        return tokens


def tokenize(source: str) -> List[Token]:
    return Lexer(source).tokenize()
