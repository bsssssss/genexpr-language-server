import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokensBuilder } from "vscode-languageserver/node";
import Parser from "tree-sitter";

import { Scope, VisitorContext } from "./visitors/types";
import { parser } from "./parser-config";
import { visitorRegistry } from "./visitors";
import { FunctionDefinitionVisitor, functionDefinitionRegistry } from "./visitors/function-definition-visitor";
import logger from "../utils/logger";
import { MainVisitor } from "./visitors/main-visitor";

/////////////////////////////////////////////////////////////////////////////////

/**
 * @description Parse a document using the tree-sitter library
 *
 * @param {TextDocument} document The document to parse
 *
 * @returns An object with the analysis result:
 * @returns {SemanticTokens} returns.semanticTokens - Built semantic tokens
 *
 */
export function parseDocument(document: TextDocument) {

  const tree = parser.parse(document.getText());
  const tokensBuilder = new SemanticTokensBuilder();

  const context: VisitorContext = {
    semanticTokensBuilder: tokensBuilder
  }

  functionDefinitionRegistry.clear();
  const mainScope = new Scope(null);

  for (const node of tree.rootNode.children) {
    if (node.type === 'compiler_command') {
      // logger.warn(`No implementation for ${node.type}`);
    }
    else if (node.type === 'function_declaration') {
      logger.debug(`Processing ${node.type}...`);
      new FunctionDefinitionVisitor().visit(node, context);
    }
    else {
      // Create a unique instance of MainVisitor for all statements
      MainVisitor.getInstance().visit(node, context, mainScope);
    }
  }

  //const funcs = JSON.stringify(funcDefRegistry.getAll(), null, 2);
  //logger.debug(`Collected function declarations:\n${funcs}`);

  // logger.emptyLine();

  return {
    semanticTokens: tokensBuilder.build()
  }
}

// function ProcessNode(node: Parser.SyntaxNode, context: VisitorContext) {
//   logger.debug(`Parsing ${node.type}...`);
//
//   if (node.type === 'compiler_command') {
//     logger.warn(`No implementation for ${node.type}`);
//   }
//   else if (node.type === 'function_declaration') {
//     logger.debug(`Processing ${node.type}...`);
//     new FunctionDefinitionVisitor().visit(node, context);
//   }
//   else {
//     processMain(node, context);
//   }
//   logger.emptyLine();
// }

/**
 * @description Recursively traverse the syntax tree and visit nodes if registered in visitorRegistry
 */
// function traverseTree(node: Parser.SyntaxNode, context: VisitorContext) {
//
//   logger.debug(`Parsing node: ${node.type}`);
//
//   if (node.type === 'compiler_command') {
//     logger.warn(`No implementation for compiler commands`);
//   }
//   if (node.type === 'function_declaration') {
//     new FuncDefVisitor().visit(node, context);
//   }
//
//   // Recursive call
//   for (const child of node.children) {
//     traverseTree(child, context);
//   }
// }




