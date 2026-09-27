"""
JOCKY parser: token stream -> AST.

Grammar (subset sufficient for forensic scripts):

    program     := stmt*
    stmt        := fnDecl | letStmt | outputStmt | ifStmt | exprStmt
    fnDecl      := 'fn' IDENT '(' params? ')' '{' stmt* '}'
    params      := IDENT (',' IDENT)*
    letStmt     := 'let' IDENT '=' expr
    outputStmt  := 'output' expr
    ifStmt      := 'if' expr '{' stmt* '}' ('else' (ifStmt | '{' stmt* '}'))?
    exprStmt    := expr
    expr        := or
    or          := and (('||') and)*
    and         := equality (('&&') equality)*
    equality    := comparison (('==' | '!=') comparison)*
    comparison  := term (('<' | '>' | '<=' | '>=') term)*
    term        := factor (('+' | '-') factor)*
    factor      := unary (('*' | '/') unary)*
    unary       := '!' unary | primary
    primary     := NUMBER | STRING | 'true' | 'false'
                 | IDENT '(' args? ')'            # call, possibly dotted via IDENT '.' IDENT
                 | BUILTIN '(' args? ')'
                 | KEYWORD '(' args? ')'          # encrypt(...), log(...)
                 | IDENT ('.' IDENT)*             # variable / dotted name
                 | '(' expr ')'
    args        := expr (',' expr)*
"""

from dataclasses import dataclass, field
from typing import List, Optional, Union

from compiler.lexer import Lexer, Token, TokenType


# ---------------------------------------------------------------- AST nodes

@dataclass
class Literal:
    value: Union[str, int, bool]


@dataclass
class Ident:
    name: str


@dataclass
class Call:
    name: str          # "collect_processes" or "system.info"
    args: List[object] = field(default_factory=list)


@dataclass
class Binary:
    op: str
    left: object
    right: object


@dataclass
class Unary:
    op: str
    operand: object


@dataclass
class Let:
    name: str
    expr: object


@dataclass
class Output:
    expr: object


@dataclass
class If:
    cond: object
    then_body: List[object]
    else_body: Optional[List[object]]   # None | list of stmts (may contain nested If)


@dataclass
class ExprStmt:
    expr: object


@dataclass
class FnDecl:
    name: str
    params: List[str]
    body: List[object]


@dataclass
class Program:
    stmts: List[object] = field(default_factory=list)          # top-level statements
    functions: List[FnDecl] = field(default_factory=list)      # fn declarations

    @property
    def function_map(self):
        return {f.name: f for f in self.functions}


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.position = 0

    # ----------------------------------------------------------- utilities

    def current(self) -> Token:
        return self.tokens[self.position]

    def peek(self, offset: int = 0) -> Token:
        idx = min(self.position + offset, len(self.tokens) - 1)
        return self.tokens[idx]

    def advance(self) -> Token:
        token = self.current()
        if token.type is not TokenType.EOF:
            self.position += 1
        return token

    def check_punct(self, value: str) -> bool:
        t = self.current()
        return t.type is TokenType.PUNCT and t.value == value

    def check_keyword(self, value: str) -> bool:
        t = self.current()
        return t.type is TokenType.KEYWORD and t.value == value

    def accept_punct(self, value: str) -> bool:
        if self.check_punct(value):
            self.advance()
            return True
        return False

    def expect_punct(self, value: str) -> None:
        if not self.accept_punct(value):
            t = self.current()
            raise SyntaxError(f"Expected '{value}' but got {t.name} ({t.value!r}) at position {t.position}")

    def expect_type(self, token_type: TokenType, what: str) -> Token:
        t = self.current()
        if t.type is not token_type:
            raise SyntaxError(f"Expected {what} but got {t.name} ({t.value!r}) at position {t.position}")
        return self.advance()

    # ------------------------------------------------------------ entries

    def parse(self) -> Program:
        program = Program()
        while self.current().type is not TokenType.EOF:
            stmt = self.parse_stmt()
            if isinstance(stmt, FnDecl):
                program.functions.append(stmt)
            else:
                program.stmts.append(stmt)
        return program

    def parse_stmt(self):
        if self.check_keyword("fn"):
            return self.parse_fn()
        if self.check_keyword("let"):
            return self.parse_let()
        if self.check_keyword("output"):
            self.advance()
            expr = self.parse_expr()
            self.accept_punct(";")
            return Output(expr)
        if self.check_keyword("if"):
            return self.parse_if()
        expr = self.parse_expr()
        self.accept_punct(";")
        return ExprStmt(expr)

    def parse_fn(self) -> FnDecl:
        self.advance()  # 'fn'
        name_tok = self.current()
        if name_tok.type not in (TokenType.IDENTIFIER, TokenType.BUILTIN):
            raise SyntaxError(f"Expected function name but got {name_tok.name} ({name_tok.value!r})")
        self.advance()
        name = str(name_tok.value)
        self.expect_punct("(")
        params: List[str] = []
        if not self.check_punct(")"):
            while True:
                params.append(self.expect_type(TokenType.IDENTIFIER, "parameter name").value)
                # Optional type annotation: pid: int
                if self.accept_punct(":"):
                    self.advance()  # type name (IDENTIFIER or TYPE keyword-like IDENT)
                if not self.accept_punct(","):
                    break
        self.expect_punct(")")
        self.expect_punct("{")
        body = []
        while not self.check_punct("}"):
            if self.current().type is TokenType.EOF:
                raise SyntaxError(f"Unexpected EOF inside fn {name}")
            body.append(self.parse_stmt())
        self.expect_punct("}")
        return FnDecl(name, params, body)

    def parse_let(self) -> Let:
        self.advance()  # 'let'
        name = self.expect_type(TokenType.IDENTIFIER, "variable name").value
        self.expect_punct("=")
        expr = self.parse_expr()
        self.accept_punct(";")
        return Let(name, expr)

    def parse_if(self) -> If:
        self.advance()  # 'if'
        cond = self.parse_expr()
        self.expect_punct("{")
        then_body = []
        while not self.check_punct("}"):
            if self.current().type is TokenType.EOF:
                raise SyntaxError("Unexpected EOF inside if block")
            then_body.append(self.parse_stmt())
        self.expect_punct("}")

        else_body: Optional[List[object]] = None
        if self.check_keyword("else"):
            self.advance()
            if self.check_keyword("if"):
                else_body = [self.parse_if()]
            else:
                self.expect_punct("{")
                else_body = []
                while not self.check_punct("}"):
                    if self.current().type is TokenType.EOF:
                        raise SyntaxError("Unexpected EOF inside else block")
                    else_body.append(self.parse_stmt())
                self.expect_punct("}")
        return If(cond, then_body, else_body)

    # --------------------------------------------------------- expressions

    def parse_expr(self):
        return self.parse_or()

    def parse_or(self):
        node = self.parse_and()
        while self.check_punct("||"):
            self.advance()
            node = Binary("||", node, self.parse_and())
        return node

    def parse_and(self):
        node = self.parse_equality()
        while self.check_punct("&&"):
            self.advance()
            node = Binary("&&", node, self.parse_equality())
        return node

    def parse_equality(self):
        node = self.parse_comparison()
        while self.check_punct("==") or self.check_punct("!="):
            op = self.advance().value
            node = Binary(op, node, self.parse_comparison())
        return node

    def parse_comparison(self):
        node = self.parse_term()
        while self.check_punct("<") or self.check_punct(">") or self.check_punct("<=") or self.check_punct(">="):
            op = self.advance().value
            node = Binary(op, node, self.parse_term())
        return node

    def parse_term(self):
        node = self.parse_factor()
        while self.check_punct("+") or self.check_punct("-"):
            op = self.advance().value
            node = Binary(op, node, self.parse_factor())
        return node

    def parse_factor(self):
        node = self.parse_unary()
        while self.check_punct("*") or self.check_punct("/"):
            op = self.advance().value
            node = Binary(op, node, self.parse_unary())
        return node

    def parse_unary(self):
        if self.check_punct("!"):
            self.advance()
            return Unary("!", self.parse_unary())
        if self.check_punct("-"):
            self.advance()
            return Unary("-", self.parse_unary())
        return self.parse_primary()

    def parse_primary(self):
        t = self.current()

        if t.type is TokenType.NUMBER:
            self.advance()
            return Literal(t.value)

        if t.type is TokenType.STRING:
            self.advance()
            return Literal(t.value)

        if t.type is TokenType.KEYWORD and t.value in ("true", "false"):
            self.advance()
            return Literal(t.value == "true")

        # Call forms: BUILTIN(...), KEYWORD(...) e.g. encrypt/log, IDENT(...), IDENT.IDENT(...)
        if t.type in (TokenType.BUILTIN, TokenType.IDENTIFIER) or (
            t.type is TokenType.KEYWORD and self.peek(1).type is TokenType.PUNCT and self.peek(1).value == "("
        ):
            if t.type is TokenType.KEYWORD and t.value in ("if", "else", "fn", "let", "output", "return"):
                raise SyntaxError(f"Unexpected keyword '{t.value}' in expression at position {t.position}")
            return self.parse_call_or_name()

        if t.type is TokenType.PUNCT and t.value == "(":
            self.advance()
            node = self.parse_expr()
            self.expect_punct(")")
            return node

        raise SyntaxError(f"Unexpected token {t.name} ({t.value!r}) at position {t.position}")

    def parse_call_or_name(self):
        first = self.advance()
        name = str(first.value)

        # Dotted name: system.info
        if self.check_punct("."):
            self.advance()
            second = self.expect_type(TokenType.IDENTIFIER, "member name after '.'")
            name = f"{name}.{second.value}"

        # Call?
        if self.check_punct("("):
            self.advance()
            args = []
            if not self.check_punct(")"):
                while True:
                    args.append(self.parse_expr())
                    if not self.accept_punct(","):
                        break
            self.expect_punct(")")
            return Call(name, args)

        # Plain (possibly dotted) variable reference
        if "." in name:
            raise SyntaxError(f"Dotted name '{name}' must be called as a function")
        return Ident(name)


def parse(source: str) -> Program:
    """Convenience: source -> Program AST."""
    return Parser(Lexer(source).tokenize()).parse()


def parse_call(source: str) -> Call:
    """Compatibility helper: parse a source containing a single bare call."""
    program = parse(source)
    if program.stmts and isinstance(program.stmts[0], ExprStmt):
        return program.stmts[0].expr
    if program.stmts and isinstance(program.stmts[0], Output):
        return program.stmts[0].expr
    raise SyntaxError("Source does not contain a single call expression")
