from dataclasses import dataclass
from enum import Enum, auto


class TokenType(Enum):
    IDENTIFIER = auto()
    DOT = auto()
    LEFT_PAREN = auto()
    RIGHT_PAREN = auto()
    EOF = auto()


@dataclass
class Token:
    type: TokenType
    value: str
    position: int


class Lexer:
    def __init__(self, source: str):
        self.source = source
        self.position = 0

    def tokenize(self):
        tokens = []

        while self.position < len(self.source):
            char = self.source[self.position]

            # Ignore whitespace
            if char.isspace():
                self.position += 1
                continue

            # Identifier
            if char.isalpha() or char == "_":
                start = self.position

                while (
                    self.position < len(self.source)
                    and (
                        self.source[self.position].isalnum()
                        or self.source[self.position] == "_"
                    )
                ):
                    self.position += 1

                value = self.source[start:self.position]

                tokens.append(
                    Token(
                        TokenType.IDENTIFIER,
                        value,
                        start,
                    )
                )

                continue

            # Dot
            if char == ".":
                tokens.append(
                    Token(
                        TokenType.DOT,
                        char,
                        self.position,
                    )
                )

                self.position += 1
                continue

            # (
            if char == "(":
                tokens.append(
                    Token(
                        TokenType.LEFT_PAREN,
                        char,
                        self.position,
                    )
                )

                self.position += 1
                continue

            # )
            if char == ")":
                tokens.append(
                    Token(
                        TokenType.RIGHT_PAREN,
                        char,
                        self.position,
                    )
                )

                self.position += 1
                continue

            raise SyntaxError(
                f"Unexpected character '{char}' at position {self.position}"
            )

        tokens.append(
            Token(
                TokenType.EOF,
                "",
                self.position,
            )
        )

        return tokens