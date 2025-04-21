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

enum Scope {
  FunctionBody,
  SelectionStatementConsequence
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
        const localVariables = new Set<string>();
        this.processFunctionBody(node, builder, functionInfo, localVariables);
      }
    }
  }

  /**
   * @description Handle the signature (ie. header) part of the function definition
   *
   **/
  private processSignature(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {

    const nameNode = node.childForFieldName('name');
    if (!nameNode) { return }

    const funcName = nameNode.text;

    const paramNames: string[] = [];
    const paramNodes = node.childrenForFieldName('parameter')

    paramNodes.forEach(n => {
      paramNames.push(n.text)
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

    // If the function was stored, tokenize name  and params
    addToken(nameNode, builder, TokenTypes.Function, TokenModifiers.Definition);
    paramNodes.forEach(n => {
      addToken(n, builder, TokenTypes.Parameter, TokenModifiers.Definition);
    })

    return functionInfo;
  }

  private processFunctionBody(node: Parser.SyntaxNode, builder: SemanticTokensBuilder, funcInfo: FunctionInfo, localVariables: Set<string>) {

    const bodyNode = node.childForFieldName('body');
    if (!bodyNode) { return };

    const statements = bodyNode.childForFieldName('statements');
    if (!statements) { return };

    statements.children.forEach(n => {
      if (n.type === 'expression_statement') {
        this.processExpressionStatement(n, builder, funcInfo, localVariables, Scope.FunctionBody);
      }
      if (n.type === 'selection_statement') {
        this.processSelectionStatement(n, builder, funcInfo, localVariables);
      }
      if (n.type === 'return_statement') {
        this.processReturnStatement(n, builder, funcInfo, localVariables)
      }
    })
  }

  private processExpressionStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>,
    scope: Scope
  ) {

    const statement = node.firstChild;
    if (!statement) { return };

    const isAssignment = statement.type === 'single_assignment' || statement.type === 'multiple_assignment';
    if (!isAssignment) { return };

    const right = statement.childrenForFieldName('right')
    const left = statement.childrenForFieldName('left')

    // Handle right side
    right.forEach(n => {
      const rightIds = collectIdentifiers(n);
      rightIds.forEach(i => {
        this.tokenizeIdentifier(i, builder, funcInfo.parameters, localVariables);
      })
    })

    if (scope === Scope.FunctionBody) {
      // Handle left side (local variables)
      left.forEach(n => {
        localVariables.add(n.text);
        addToken(n, builder, TokenTypes.Variable)
      })
    }

    else if (scope === Scope.SelectionStatementConsequence) {
      left.forEach(n => {
        if (!funcInfo.parameters.includes(n.text) && !localVariables.has(n.text)) {
          addToken(n, builder, TokenTypes.Comment);
        }
        else if (funcInfo.parameters.includes(n.text)) {
          localVariables.add(n.text);
          this.tokenizeIdentifier(n, builder, funcInfo.parameters, localVariables);
        }
      })
    }
  }

  private processSelectionStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>
  ) {

    const conditionNode = node.childForFieldName('condition')
    if (!conditionNode) { return };

    conditionNode.children.forEach(n => {
      const ids = collectIdentifiers(n);
      ids.forEach(i => {
        this.tokenizeIdentifier(i, builder, funcInfo.parameters, localVariables);
      })
    })

    const consequenceNode = node.childrenForFieldName('consequence');
    if (!consequenceNode) { return };

    consequenceNode.forEach(n => {
      if (n.type === 'expr_statement_list') {
        n.children.forEach(s => {
          if (s.type === 'expression_statement') {
            this.processExpressionStatement(s, builder, funcInfo, localVariables, Scope.SelectionStatementConsequence);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, builder, funcInfo, localVariables);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, builder, funcInfo, localVariables);
          }
        })
      }
    })

    // !! Should create scopes for local variables in selection statements !!

    const alternativeNode = node.childrenForFieldName('alternative');
    if (!alternativeNode) { return };

    alternativeNode.forEach(n => {
      if (n.type === 'expr_statement_list') {
        n.children.forEach(s => {
          if (s.type === 'expression_statement') {
            this.processExpressionStatement(s, builder, funcInfo, localVariables, Scope.SelectionStatementConsequence);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, builder, funcInfo, localVariables);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, builder, funcInfo, localVariables);
          }
        })
      }
    })
  }

  private processReturnStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    localVariables: Set<string>
  ) {

    const identifiers = collectIdentifiers(node);

    identifiers.forEach(i => {
      this.tokenizeIdentifier(i, builder, funcInfo.parameters, localVariables);
    })
  }

  private tokenizeIdentifier(
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
    else {
      addToken(node, builder, TokenTypes.Comment);
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
   * @description Clear all stored functions infos
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
