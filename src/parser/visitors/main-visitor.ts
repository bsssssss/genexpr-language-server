import Parser from "tree-sitter";

import { SemanticTokensBuilder } from "vscode-languageserver";

import { NodeVisitor, Scope, VisitorContext } from "./types";
import { pushToken, TokenModifiers, TokenTypes } from "../semanticTokens";
import logger from "../../utils/logger"

/*
 * This module implements the analysis of the main scope 
 *
 */

export class MainVisitor {

  private static instance: MainVisitor;
  private constructor() { };

  public static getInstance(): MainVisitor {
    if (!MainVisitor.instance) {
      MainVisitor.instance = new MainVisitor();
    }
    return MainVisitor.instance;
  }

  visit(node: Parser.SyntaxNode, context: VisitorContext, scope: Scope) {
    // logger.debug(`Visiting node: ${node.type}`);

    if (node.type === 'declaration') {
      this.processDeclaration(node, context, scope);
    }
    if (node.type === 'expression_statement') {
      this.processExpressionStatement(node, context, scope);
    }
    if (node.type === 'selection_statement') {
      this.processSelectionStatement(node, context, scope);
    }
  }

  private processDeclaration(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    scope: Scope
  ) {
    node.children.forEach(n => {
      if (n.type === 'identifier') {
        scope.add(n.text);
        this.tokenize(n, context, scope);
      }
    })
  }

  private processExpressionStatement(
    node: Parser.SyntaxNode,
    context: VisitorContext,
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
        this.tokenize(i, context, scope);
      })
    })

    // Handle left side (local variables)
    left.forEach(i => {
      if (i.type === 'identifier') {
        scope.add(i.text);
        this.tokenize(i, context, scope);
      }
    })
  }

  private processSelectionStatement(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    parentScope: Scope
  ) {

    // If condition statement
    const conditionNode = node.childForFieldName('condition')
    if (!conditionNode) { return };

    // Simple statement
    if (conditionNode.type === 'identifier') {
      this.tokenize(conditionNode, context, parentScope);
    }
    // Expression
    else {
      conditionNode.children.forEach(n => {
        const ids = this.collectIdentifiers(n);
        ids.forEach(i => {
          this.tokenize(i, context, parentScope);
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
            this.processExpressionStatement(s, context, consequenceScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, context, consequenceScope);
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
            this.processExpressionStatement(s, context, alternativeScope);
          }
          if (s.type === 'selection_statement') {
            this.processSelectionStatement(s, context, alternativeScope);
          }
        })
      }
      if (n.type === 'selection_statement') {
        this.processSelectionStatement(n, context, alternativeScope);
      }
    })
  }

  private tokenize(
    node: Parser.SyntaxNode,
    context: VisitorContext,
    scope: Scope
  ) {
    const builder = context.semanticTokensBuilder;

    if (scope.has(node.text)) {
      pushToken(node, builder, TokenTypes.Variable)
    }
    else {
      // Error - Variable <node> not defined
      pushToken(node, builder, TokenTypes.Comment)
    }

  }

  /*
   * @description Recursively collect all identifiers.
   */
  private collectIdentifiers(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
    let identifiers: Parser.SyntaxNode[] = [];
    if (node.type === 'identifier') {
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

export const mainVisitor = MainVisitor.getInstance();
