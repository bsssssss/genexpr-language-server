import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

export interface VisitorContext {
  semanticTokensBuilder?: SemanticTokensBuilder
}

export interface NodeVisitor {
  visit(node: Parser.SyntaxNode, context: VisitorContext): void
}
