from dataclasses import dataclass

from compiler.lexer import Lexer, Token, TokenType


@dataclass
class FunctionCall:
    namespace: str
    function: str


class Parser:
    def __init__(self, tokens: list[Token]):
        self.tokens = tokens
        self.position = 0

    def current(self) -> Token:
        return self.tokens[self.position]

    def advance(self) -> Token:
        token = self.current()
        self.position += 1
        return token

    def expect(self, token_type: TokenType) -> Token:
        token = self.current()

        if token.type != token_type:
            raise SyntaxError(
                f"Expected {token_type.name} at position "
                f"{token.position}, got {token.type.name}"
            )

        return self.advance()

    def parse(self) -> FunctionCall:
        namespace = self.expect(TokenType.IDENTIFIER).value

        self.expect(TokenType.DOT)

        function = self.expect(TokenType.IDENTIFIER).value

        self.expect(TokenType.LEFT_PAREN)
        self.expect(TokenType.RIGHT_PAREN)

        self.expect(TokenType.EOF)

        return FunctionCall(
            namespace=namespace,
            function=function,
        )


def parse(source: str) -> FunctionCall:
    lexer = Lexer(source)
    tokens = lexer.tokenize()

    parser = Parser(tokens)

    return parser.parse()