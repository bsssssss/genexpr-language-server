import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

export interface VisitorContext {
  semanticTokensContext?: SemanticTokensBuilder
}

export interface NodeVisitor {
  visit(node: Parser.SyntaxNode, context: VisitorContext): void
}
