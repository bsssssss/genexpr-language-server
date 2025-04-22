import Parser from "tree-sitter";

import { Scope, VisitorContext } from "./types";
import { pushToken, TokenModifiers, TokenTypes } from "../semanticTokens";
import logger from "../../utils/logger"

/*
 * This module implements the analysis of function definitions 
 *
 * TODO: 
 *    - Iteration statements
 *    - Diagnostics
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

export class FunctionDefinitionVisitor {

  /**
   * @description Process function definition node
   * 
   **/
  visit(node: Parser.SyntaxNode, context: VisitorContext): void {
    const functionInfo = this.processSignature(node, context);

    if (functionInfo) {
      const functionScope = new Scope(null);
      this.processFunctionBody(node, context, functionInfo, functionScope);
    }
  }

  /**
   * @description Handle the signature (ie. header) part of the function definition
   *
   **/
  private processSignature(node: Parser.SyntaxNode, context: VisitorContext) {

    const name = node.childForFieldName('name');
    if (!name) { return }

    const parameters = node.childrenForFieldName('parameter')

    const functionInfo: FunctionInfo = {
      name: {
        text: name.text,
        node: name
      },
      parameters: parameters.map(n => ({
        text: n.text,
        node: n
      }))
    }

    if (!functionDefinitionRegistry.add(functionInfo)) {
      logger.warn(`Not adding function '${name.text}', it is already stored !`);
      return;
    }

    // If the function was stored, tokenize name and params
    const builder = context.semanticTokensBuilder;
    pushToken(name, builder, TokenTypes.Function, TokenModifiers.Definition);
    parameters.forEach(n => {
      pushToken(n, builder, TokenTypes.Parameter, TokenModifiers.Definition);
    })

    return functionInfo;
  }

  private processFunctionBody(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {

    const bodyNode = node.childForFieldName('body');
    if (!bodyNode) { return };

    bodyNode.children.filter(n => n.type === 'declaration')
      .forEach(d => {
        this.processDeclaration(d, context, funcInfo, scope);
      })

    const statements = bodyNode.childForFieldName('statements');
    if (!statements) { return };

    statements.children.forEach(n => {
      if (n.type === 'expression_statement') {
        // this.processMainScopeExpressions(n, context, funcInfo, scope);
        this.processExpressionStatement(n, context, funcInfo, scope);
      }
      if (n.type === 'selection_statement') {
        this.processSelectionStatement(n, context, funcInfo, scope);
      }
      if (n.type === 'return_statement') {
        this.processReturnStatement(n, context, funcInfo, scope)
      }
    })
  }

  // TODO: Make this a special variable 
  //
  private processDeclaration(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {
    node.children.forEach(n => {
      if (n.type === 'identifier') {
        scope.add(n.text);
        this.tokenize(n, context, funcInfo, scope);
      }
    })
  }

  private processExpressionStatement(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    scope: Scope,
  ) {

    const statement = node.firstChild;
    if (!statement) { return };

    const isAssignment = statement.type === 'single_assignment' || statement.type === 'multiple_assignment';
    if (!isAssignment) { return };

    const right = statement.childrenForFieldName('right')
    const left = statement.childrenForFieldName('left')

    // Handle right side of assignement
    right.forEach(n => {
      const rightIds = this.collectIdentifiers(n);
      rightIds.forEach(i => {
        this.tokenize(i, context, funcInfo, scope);
      })
    })

    // Handle left side (local variables)
    left.forEach(i => {
      scope.add(i.text);
      this.tokenize(i, context, funcInfo, scope);
    })
  }

  private processSelectionStatement(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    parentScope: Scope
  ) {

    // If condition statement
    const conditionNode = node.childForFieldName('condition')
    if (!conditionNode) { return };

    // Simple statement
    if (conditionNode.type === 'identifier' || conditionNode.type === 'inlet_outlet') {
      this.tokenize(conditionNode, context, funcInfo, parentScope);
    }
    // Expression
    else {
      conditionNode.children.forEach(n => {
        const ids = this.collectIdentifiers(n);
        ids.forEach(i => {
          this.tokenize(i, context, funcInfo, parentScope);
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
            this.processExpressionStatement(s, context, funcInfo, consequenceScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, context, funcInfo, consequenceScope);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, context, funcInfo, consequenceScope);
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
            this.processExpressionStatement(s, context, funcInfo, alternativeScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, context, funcInfo, alternativeScope);
          }
          if (s.type === 'return_statement') {
            this.processReturnStatement(s, context, funcInfo, alternativeScope);
          }
        })
      }
      if (n.type === 'selection_statement') {
        this.processSelectionStatement(n, context, funcInfo, alternativeScope);
      }
    })
  }

  private processReturnStatement(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {
    const identifiers = this.collectIdentifiers(node);
    const parameters = funcInfo.parameters.map(p => p.text);

    identifiers.forEach(i => {

      if (parameters.includes(i.text)) {
        if (scope.hasOwn(i.text)) {
          pushToken(i, context.semanticTokensBuilder, TokenTypes.Variable);
        }
        else {
          pushToken(i, context.semanticTokensBuilder, TokenTypes.Parameter);
        }
      }
      else if (scope.has(i.text)) {
        pushToken(i, context.semanticTokensBuilder, TokenTypes.Variable);
      }
      else {
        // Error - variable <i> is not defined
        pushToken(i, context.semanticTokensBuilder, TokenTypes.Comment);
      }
      // this.tokenizeIdentifier(i, context, funcInfo, scope);
    })
  }

  private tokenize(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    funcInfo: FunctionInfo,
    scope: Scope
  ) {
    const builder = context.semanticTokensBuilder;
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

  /*
   * @description Recursively collect all identifiers and inlet_outlet nodes.
   */
  private collectIdentifiers(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
    let identifiers: Parser.SyntaxNode[] = [];
    if (node.type === 'identifier' || node.type === 'inlet_outlet') {
      identifiers.push(node);
    }
    for (const child of node.children) {
      if (child) {
        identifiers = identifiers.concat(this.collectIdentifiers(child));
      }
    }
    return identifiers;
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
   * @description Clear all stored functions
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



