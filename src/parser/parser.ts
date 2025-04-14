import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokensBuilder } from "vscode-languageserver/node";
import Parser from "tree-sitter";

import { VisitorContext } from "./visitors/types";
import { parser } from "./parser-config";
import { visitorRegistry } from "./visitors";
import { funcNames } from "./semanticTokens";

/////////////////////////////////////////////////////////////////////////////////

export function processDocument(document: TextDocument) {

  const tree = parser.parse(document.getText());
  const tokensBuilder = new SemanticTokensBuilder();

  const context: VisitorContext = {
    semanticTokensContext: tokensBuilder
  }

  funcNames = [];

  traverseTree(tree.rootNode, context);

  return {
    semanticTokens: tokensBuilder.build()
  }
}

function traverseTree(node: Parser.SyntaxNode, context: VisitorContext) {
  const visitor = visitorRegistry[node.type];
  if (visitor) {
    visitor.visit(node, context);
  }
  // Recursive call
  for (const child of node.children) {
    traverseTree(child, context);
  }
}
