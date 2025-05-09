import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokensBuilder } from "vscode-languageserver/node";
import Parser from "tree-sitter";

import { VisitorContext } from "./visitors/types";
import { parser } from "./parser-config";
import { visitorRegistry } from "./visitors";
import { functionDefinitionRegistry } from "./visitors/function-definition-visitor";
import logger from "../utils/logger";

/////////////////////////////////////////////////////////////////////////////////

/**
 * @description Parse a document using the tree-sitter library
 *
 * @param {TextDocument} document The document to parse
 *
 * @returns An object with the analysis result:
 * @returns {SemanticTokens} returns.semanticTokens - Built semantic tokens for syntax highlighting
 */
export function parseDocument(document: TextDocument) {

  const tree = parser.parse(document.getText());
  const tokensBuilder = new SemanticTokensBuilder();

  const context: VisitorContext = {
    semanticTokensBuilder: tokensBuilder
  }

  functionDefinitionRegistry.clear();
  traverseTree(tree.rootNode, context);

  //const funcs = JSON.stringify(funcDefRegistry.getAll(), null, 2);
  //logger.debug(`Collected function declarations:\n${funcs}`);
  //logger.emptyLine();

  return {
    semanticTokens: tokensBuilder.build()
  }
}

/**
 * @description Recursively traverse the syntax tree and visit nodes if registered in visitorRegistry
 */
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
