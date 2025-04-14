import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import Parser from 'tree-sitter';
import logger from '../utils/logger';

export enum TokenTypes {
  Function,
  Parameter,
  Variable,
  Constant,
  Object,
  Attribute
}
export const tokenTypesLegend = [
  'function',
  'parameter',
  'variable',
  'constant',
  'object',
  'attribute'
]

export enum TokenModifiers {
  Declaration,
  Definition,
  Special,
  Builtin
}
export const tokenModifiersLegend = [
  'declaration',
  'definition',
  'special',
  'builtin'
]

export let funcNames: string[] = [];

export function processTokens(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {
  logger.debug(`Processing tokens in ${node.type} node...\n`);
  
  return builder.build();
}

export function addToken(node: Parser.SyntaxNode, builder: SemanticTokensBuilder, type: TokenTypes, modifier: TokenModifiers) {
  builder.push(
    node.startPosition.row,
    node.startPosition.column,
    node.text.length,
    type,
    1 << modifier
  )
}

// Recursively collect all identifier nodes in node
export function collectIdentifiers(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  let identifiers: Parser.SyntaxNode[] = [];
  if (node.type === 'identifier') {
    identifiers.push(node);
  }
  for (const child of node.children) {
    if (child) {
      identifiers = identifiers.concat(collectIdentifiers(child));
    }
  }
  return identifiers;
}
