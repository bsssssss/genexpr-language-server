import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

export interface VisitorContext {
  semanticTokensBuilder?: SemanticTokensBuilder
}

export interface NodeVisitor {
  visit(node: Parser.SyntaxNode, context: VisitorContext): void
}

export class Scope {
  private parent: Scope | null;
  private variable: Map<string, boolean> = new Map();
  
  constructor (parent: Scope | null = null) {
    this.parent = parent;
  }

  public add(name: string) {
    this.variable.set(name, true);
  }

  public hasOwn(name: string) {
    return this.variable.has(name);
  }

  public has(name: string): boolean {
    if (this.variable.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(name);
    }
    return false;
  }
}
