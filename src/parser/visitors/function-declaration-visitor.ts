import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, VisitorContext } from "./types";
import { processTokens, addToken } from "../semanticTokens";
import logger from "../../utils/logger"

/////////////////////////////////////////////////////////////////////////////////


export class FunctionDeclarationVisitor implements NodeVisitor {

  visit(node: Parser.SyntaxNode, context: VisitorContext): void {
    if (context.semanticTokensContext) {
      //logger.debug(`Processing ${node.type} node...`);

      const funcName = node.childForFieldName('name');
      if (funcName) {
        logger.debug(`Found a function decl with name: ${funcName.text}`)
      }

    }
  }
}
