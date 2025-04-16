import Parser from "tree-sitter";

import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, VisitorContext } from "./types";
import { addToken, TokenModifiers, TokenTypes } from "../semanticTokens";
import logger from "../../utils/logger"

/*
 * This module implements the analysis of function definitions 
 * TODO: Diagnostics
 *       More storage in FunctionInfo ?
 */

interface FunctionInfo {
  name: string,
  nameNode: Parser.SyntaxNode,
  parameters: string[],
  parameterNodes: Parser.SyntaxNode[]
}

export class FuncDefVisitor implements NodeVisitor {

  /**
   * @description Handle the analysis of a function definition
   * 
   **/
  visit(node: Parser.SyntaxNode, context: VisitorContext): void {

    // Process semantic tokens
    if (context.semanticTokensBuilder) {
      const builder = context.semanticTokensBuilder;

      const functionInfo = this.processSignature(node, builder);
      if (functionInfo) {
        this.processBody(node, builder, functionInfo);
      }
    }
  }

  /**
   * @description Handle the signature/header part of the function definition
   *
   **/
  private processSignature(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {

    const nameNode = node.childForFieldName('name');
    if (!nameNode) { return }

    const funcName = nameNode.text;

    const paramNames: string[] = [];
    const paramNodes = node.childrenForFieldName('parameter')

    paramNodes.forEach(p => {
      paramNames.push(p.text)
    })

    const functionInfo: FunctionInfo = {
      name: funcName,
      nameNode: nameNode,
      parameters: paramNames,
      parameterNodes: paramNodes
    }

    if (!funcDefRegistry.add(functionInfo)) {
      logger.warn(`Not adding function '${nameNode.text}', it is already stored !`);
      return;
    }

    // If the function was stored
    // Tokenize name
    addToken(nameNode, builder, TokenTypes.Function, TokenModifiers.Definition);
    // Tokenize parameters
    paramNodes.forEach(p => {
      addToken(p, builder, TokenTypes.Parameter, TokenModifiers.Definition);
    })

    return functionInfo;
  }

  private processBody(node: Parser.SyntaxNode, builder: SemanticTokensBuilder, funcInfo: FunctionInfo) {

    const funcBodyNode = node.childForFieldName('body');
    if (!funcBodyNode) { return };

    const statements = funcBodyNode.childForFieldName('statements');
    if (!statements) { return };

    const localVariables = new Set<string>();

    statements.children.forEach(s => {
      if (s.type === 'expression_statement') {
        this.processExpressionStatement(s, builder, funcInfo, localVariables);
      }
      if (s.type === 'return_statement') {
        this.processReturnStatement(s, builder, funcInfo, localVariables)
      }
    })
  }

  private processExpressionStatement(
    statement: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>
  ) {

    const assignment = statement.firstChild;

    if (!assignment) {
      return
    }

    // TODO: Handle multiple assignment ?
    if (assignment.type !== 'single_assignment') {
      return
    }

    const paramNames = funcInfo.parameters;

    const right = assignment.childForFieldName('right')
    const left = assignment.childForFieldName('left')

    // Handle right side
    if (right) {
      if (right.children) {
        // The right side is an expression
        right.children.forEach(identifier => {
          this.tokenizeInBody(identifier, builder, paramNames, localVariables);
        })
      }
      if (right.type === 'identifier') {
        // The right side is only an identifier
        this.tokenizeInBody(right, builder, paramNames, localVariables);
      }
    }

    // Handle left side (local variables)
    if (left) {
      localVariables.add(left.text);
      addToken(left, builder, TokenTypes.Variable, 0)
    }
  }

  private processReturnStatement(
    statement: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>
  ) {

    const paramNames = funcInfo.parameters;

    statement.children.forEach(returnStatement => {
      if (returnStatement.children) {

        returnStatement.children.forEach(i => {
          this.tokenizeInBody(i, builder, paramNames, localVariables);
        })
      }

      if (returnStatement.type === 'identifier') {
        this.tokenizeInBody(returnStatement, builder, paramNames, localVariables);
      }
    })
  }

  private tokenizeInBody(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    params: string[],
    localVariables: Set<string>
  ) {
    if (params.includes(node.text) && !localVariables.has(node.text)) {
      addToken(node, builder, TokenTypes.Parameter, 0)
    }
    else if (localVariables.has(node.text)) {
      addToken(node, builder, TokenTypes.Variable, 0);
    }
  }
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
   * @description Clear stored functions infos
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

  /**
   * @description Check if the function is in registry by name
   *
   * @param {string} name The function name to check 
   */
  public has(name: string): boolean {
    if (this.functions.has(name)) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * @description Get function informations
   *
   * @param {string} name The function name 
   *
   * @returns {FunctionInfo | undefined} 
   */
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
