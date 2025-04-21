import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import Parser from 'tree-sitter';

export enum TokenTypes {
  Function,
  Parameter,
  Variable,
  Constant,
  Object,
  Attribute,
  Comment,
}

export const tokenTypesLegend = [
  'function',
  'parameter',
  'variable',
  'constant',
  'object',
  'attribute',
  'comment'
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

export function pushToken(
  node: Parser.SyntaxNode,
  builder: SemanticTokensBuilder,
  type: TokenTypes,
  modifier?: TokenModifiers
) {
  builder.push(
    node.startPosition.row,
    node.startPosition.column,
    node.text.length,
    type,
    modifier ? 1 << modifier : 0
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
