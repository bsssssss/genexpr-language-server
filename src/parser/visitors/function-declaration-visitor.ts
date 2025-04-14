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
        funcDefRegistry.add(funcName.text);
      }
    }
  }
}

export class FuncDefRegistry {
  private static instance: FuncDefRegistry;

  private funcNames: string[] = [];

  // Make sure we have only one instance
  private constructor() { };

  public static getInstance(): FuncDefRegistry {
    if (!FuncDefRegistry.instance) {
      FuncDefRegistry.instance = new FuncDefRegistry();
    }
    return FuncDefRegistry.instance
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
      logger.info(`Adding name '${name}' to registry`)
      this.funcNames.push(name);
    } else {
      logger.info(`Name '${name}' already stored !`)
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
export const funcDefRegistry = FuncDefRegistry.getInstance();
