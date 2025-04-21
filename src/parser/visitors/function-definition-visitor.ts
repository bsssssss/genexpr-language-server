import Parser from "tree-sitter";

import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, Scope, VisitorContext } from "./types";
import { pushToken, collectIdentifiers, TokenModifiers, TokenTypes } from "../semanticTokens";
import logger from "../../utils/logger"

/*
 * This module implements the analysis of function definitions 
 * TODO: Diagnostics
 *       More storage in FunctionInfo ?
 */

interface FunctionInfo {
  name: {
    text: string,
    node: Parser.SyntaxNode,
  }
  parameters: Array<{
    text: string,
    node: Parser.SyntaxNode
  }>
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
        // const localVariables = new Set<string>();
        const functionScope = new Scope(null);
        this.processFunctionBody(node, builder, functionInfo, functionScope);
      }
    }
  }

  /**
   * @description Handle the signature (ie. header) part of the function definition
   *
   **/
  private processSignature(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {

    const name = node.childForFieldName('name');
    if (!name) { return }

    const parameters = node.childrenForFieldName('parameter')

    const functionInfo: FunctionInfo = {
      name: {
        text: name.text,
        node: name
      },
      parameters: parameters.map(node => ({
        text: node.text,
        node: node
      }))
    }

    if (!functionDefinitionRegistry.add(functionInfo)) {
      logger.warn(`Not adding function '${name.text}', it is already stored !`);
      return;
    }

    // If the function was stored, tokenize name and params
    pushToken(name, builder, TokenTypes.Function, TokenModifiers.Definition);
    parameters.forEach(n => {
      pushToken(n, builder, TokenTypes.Parameter, TokenModifiers.Definition);
    })

    return functionInfo;
  }

  private processFunctionBody(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {

    const bodyNode = node.childForFieldName('body');
    if (!bodyNode) { return };

    const statements = bodyNode.childForFieldName('statements');
    if (!statements) { return };

    statements.children.forEach(n => {
      if (n.type === 'expression_statement') {
        this.processMainScopeExpressions(n, builder, funcInfo, scope);
      }
      if (n.type === 'selection_statement') {
        this.processSelectionStatement(n, builder, funcInfo, scope);
      }
      if (n.type === 'return_statement') {
        this.processReturnStatement(n, builder, funcInfo, scope)
      }
    })
  }

  private processMainScopeExpressions(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    scope: Scope,
  ) {

    const statement = node.firstChild;
    if (!statement) { return };

    const isAssignment = statement.type === 'single_assignment' || statement.type === 'multiple_assignment';
    if (!isAssignment) { return };

    const right = statement.childrenForFieldName('right')
    const left = statement.childrenForFieldName('left')

    // Handle right side
    //
    right.forEach(n => {
      const rightIds = collectIdentifiers(n);
      rightIds.forEach(i => {
        this.tokenizeIdentifier(i, builder, funcInfo, scope);
      })
    })

    // Handle left side (local variables)
    left.forEach(i => {
      scope.add(i.text);
      this.tokenizeIdentifier(i, builder, funcInfo, scope);
    })
  }

  private processExpressionStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    scope: Scope,
  ) {

    const statement = node.firstChild;
    if (!statement) { return };

    const isAssignment = statement.type === 'single_assignment' || statement.type === 'multiple_assignment';
    if (!isAssignment) { return };

    const right = statement.childrenForFieldName('right')
    const left = statement.childrenForFieldName('left')

    // Handle right side
    //
    right.forEach(n => {
      const rightIds = collectIdentifiers(n);
      rightIds.forEach(i => {
        this.tokenizeIdentifier(i, builder, funcInfo, scope);
      })
    })

    const parameters = funcInfo.parameters.map(p => p.text);

    // Handle left side (local variables)
    left.forEach(i => {
      if (parameters.includes(i.text) || scope.has(i.text)) {
        scope.add(i.text);
      }
      else {
        // Error - Variable <i> not defined
      }
      this.tokenizeIdentifier(i, builder, funcInfo, scope);
    })
  }

  private processSelectionStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    parentScope: Scope
  ) {

    // If condition statement
    const conditionNode = node.childForFieldName('condition')
    if (!conditionNode) { return };

    if (conditionNode.type === 'identifier') {
      this.tokenizeIdentifier(conditionNode, builder, funcInfo, parentScope);
    }
    else {
      conditionNode.children.forEach(n => {
        const ids = collectIdentifiers(n);
        ids.forEach(i => {
          this.tokenizeIdentifier(i, builder, funcInfo, parentScope);
        })
      })
    }

    // If body 
    const consequenceNode = node.childrenForFieldName('consequence');
    if (!consequenceNode) { return };

    const consequenceScope = new Scope(parentScope)

    consequenceNode.forEach(n => {
      if (n.type === 'expr_statement_list') {
        n.children.forEach(s => {
          if (s.type === 'expression_statement') {
            this.processExpressionStatement(s, builder, funcInfo, consequenceScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, builder, funcInfo, consequenceScope);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, builder, funcInfo, consequenceScope);
          }
        })
      }
    })

    // Else body
    const alternativeNode = node.childrenForFieldName('alternative');
    if (!alternativeNode) { return };

    const alternativeScope = new Scope(parentScope)

    alternativeNode.forEach(n => {
      if (n.type === 'expr_statement_list') {
        n.children.forEach(s => {
          if (s.type === 'expression_statement') {
            this.processExpressionStatement(s, builder, funcInfo, alternativeScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, builder, funcInfo, alternativeScope);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, builder, funcInfo, alternativeScope);
          }
        })
      }
    })
  }

  private processReturnStatement(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {
    const identifiers = collectIdentifiers(node);

    identifiers.forEach(i => {
      this.tokenizeIdentifier(i, builder, funcInfo, scope);
    })
  }

  private tokenizeIdentifier(
    node: Parser.SyntaxNode,
    builder: SemanticTokensBuilder,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {
    const parameters = funcInfo.parameters.map(param => param.text);

    if (parameters.includes(node.text)) {
      if (scope.has(node.text)) {
        pushToken(node, builder, TokenTypes.Variable)
      }
      else {
        pushToken(node, builder, TokenTypes.Parameter)
      }
    }
    else if (scope.has(node.text)) {
      pushToken(node, builder, TokenTypes.Variable)
    }
    else {
      // Error - Variable <node> not defined
      pushToken(node, builder, TokenTypes.Comment)
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
    if (!this.functions.has(info.name.text)) {
      this.functions.set(info.name.text, info);
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
