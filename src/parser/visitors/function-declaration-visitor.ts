import Parser from "tree-sitter";
import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, VisitorContext } from "./types";
import { addToken, collectIdentifiers, TokenModifiers, TokenTypes } from "../semanticTokens";
import logger from "../../utils/logger"

/////////////////////////////////////////////////////////////////////////////////

export class FuncDefVisitor implements NodeVisitor {
  visit(node: Parser.SyntaxNode, context: VisitorContext): void {

    // Process semantic tokens
    if (context.semanticTokensContext) {

      // Collect name
      const funcNameNode = node.childForFieldName('name');
      if (funcNameNode) {
        const builder = context.semanticTokensContext;

        // Tokenize name
        addToken(funcNameNode, builder, TokenTypes.Function, TokenModifiers.Definition);

        // Collect parameters definitions and tokenize
        const paramNames: string[] = [];
        const paramNameNodes = node.childrenForFieldName('parameter')
        paramNameNodes.forEach(p => {
          paramNames.push(p.text)
          addToken(p, builder, TokenTypes.Parameter, TokenModifiers.Definition);
        })

        // Store info
        const functionInfo: FunctionInfo = {
          name: funcNameNode.text,
          parameters: paramNames
        }

        // Process functions's body
        const funcBodyNode = node.childForFieldName('body');

        if (funcBodyNode) {
          const localVariables = new Set<string>();

          // TODO: tokenize function body function :
          //    - Iterate through body nodes
          //    - if inside expression_statement, iterate through the node
          //        - FIRST handle right side of node with current local vars = tokenize
          //        - THEN handle left side = update local vars + tokenize
          //    - else handle return_statement
          //
          //    everytime we tokenize we take into account the collected parameters and local variables

        }

        // TODO: Diagnostics
        if (!funcDefRegistry.add(functionInfo)) {
          logger.warn(`Not adding function '${funcNameNode.text}', it is already stored !`)
        }
        else {
        }
      }
    }
  }
}


interface FunctionInfo {
  name: string,
  parameters: string[]
}

export class FuncDefRegistry {
  private static instance: FuncDefRegistry;

  // Maps function names to their detailed infos
  private functions: Map<string, FunctionInfo> = new Map();

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
    this.functions.clear();
  }

  /**
   * @description Add a function to the registry
   *
   * @param {FunctionInfo} info The function informations to store 
   */
  public add(info: FunctionInfo): boolean {
    if (!this.functions.has(info.name)) {
      this.functions.set(info.name, info);
      return true;
    }
    else {
      return false;
    }
  }

  public has(name: string): boolean {
    if (this.functions.has(name)) {
      return true;
    }
    else {
      return false;
    }
  }

  public get(name: string): FunctionInfo | undefined {
    if (this.functions.has(name)) {
      return this.functions.get(name);
    }
  }

  public getNames(): string[] {
    return Array.from(this.functions.keys())
  }

  public getAll(): FunctionInfo[] {
    return Array.from(this.functions.values())
  }

}

/**
 * @description The instance of the function declarations registry
 */
export const funcDefRegistry = FuncDefRegistry.getInstance();
