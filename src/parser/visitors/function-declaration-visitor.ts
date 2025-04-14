import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, VisitorContext } from "./types";
import { processTokens, addToken, funcNames } from "../semanticTokens";
import logger from "../../utils/logger"

/////////////////////////////////////////////////////////////////////////////////

export class FunctionDeclVisitor implements NodeVisitor {

  visit(node: Parser.SyntaxNode, context: VisitorContext): void {
    if (context.semanticTokensContext) {
      //logger.debug(`Processing ${node.type} node for tokens..`);
      const funcName = node.childForFieldName('name');
      if (funcName) {
        logger.info(`Adding name '${funcName.text}' to registry`)
        functionDeclRegistry.add(funcName.text);
      }
    }
  }
}

export class FunctionDeclRegistry {
  private static instance: FunctionDeclRegistry;

  private funcNames: string[] = [];

  // Make sure we have only one instance
  private constructor() { };

  public static getInstance(): FunctionDeclRegistry {
    if (!FunctionDeclRegistry.instance) {
      FunctionDeclRegistry.instance = new FunctionDeclRegistry();
    }
    return FunctionDeclRegistry.instance
  }

  /**
   * @description Clear stored names
   */
  public clear(): void {
    this.funcNames = [];
  }

  /**
   * @description Add a name to the registry
   *
   * @param {string} name - The name to store 
   */
  public add(name: string) {
    if (!this.funcNames.includes(name)) {
      this.funcNames.push(name);
    }
  }

  /**
   * @description Get stored names
   *
   * @returns {string[]} The array of names
   */
  public getNames(): string[] {
    return [... this.funcNames];
  }
}

/**
 * @description The instance of the function declarations registry
 */
export const functionDeclRegistry = FunctionDeclRegistry.getInstance();
