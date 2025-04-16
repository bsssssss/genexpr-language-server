import Parser from "tree-sitter";

import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, VisitorContext } from "./types";
import { addToken, collectIdentifiers, TokenModifiers, TokenTypes } from "../semanticTokens";
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

    if (!functionDefinitionRegistry.add(functionInfo)) {
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
      // TODO: handle selection_statement
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

    const simpleAssign = assignment.type === 'single_assignment' || assignment.type === 'multiple_assignment';
    if (!simpleAssign) {
      return
    }

    const paramNames = funcInfo.parameters;

    const right = assignment.childrenForFieldName('right')
    const left = assignment.childrenForFieldName('left')

    // Handle right side
    right.forEach(right => {
      const rightIds = collectIdentifiers(right);
      rightIds.forEach(identifier => {
        this.tokenizeInBody(identifier, builder, paramNames, localVariables);
      })
    })

    // Handle left side (local variables)
    left.forEach(left => {
      localVariables.add(left.text);
      addToken(left, builder, TokenTypes.Variable)
    })
  }

  private processReturnStatement(
    statement: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>
  ) {

    const paramNames = funcInfo.parameters;
    const identifiers = collectIdentifiers(statement);

    identifiers.forEach(i => {
      this.tokenizeInBody(i, builder, paramNames, localVariables);
    })
  }

  private tokenizeInBody(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    params: string[],
    localVariables: Set<string>
  ) {
    if (params.includes(node.text) && !localVariables.has(node.text)) {
      addToken(node, builder, TokenTypes.Parameter)
    }
    else if (localVariables.has(node.text)) {
      addToken(node, builder, TokenTypes.Variable);
    }
  }
}

export class FunctionDefinitionRegistry {
  private static instance: FunctionDefinitionRegistry;

  // Maps function names to their detailed infos
  private functions: Map<string, FunctionInfo> = new Map();

  // Make sure we have only one instance

  private constructor() { };

  public static getInstance(): FunctionDefinitionRegistry {
    if (!FunctionDefinitionRegistry.instance) {
      FunctionDefinitionRegistry.instance = new FunctionDefinitionRegistry();
    }
    return FunctionDefinitionRegistry.instance
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
export const functionDefinitionRegistry = FunctionDefinitionRegistry.getInstance();
