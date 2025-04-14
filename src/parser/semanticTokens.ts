import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import Parser from 'tree-sitter';
import { parser } from './parser-config';
import { visitorRegistry } from './visitors';
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

export function processTokens(node: Parser.SyntaxNode) {
  logger.debug(`Processing tokens in ${node.type} node...\n`);
  
}

// Recursively collect all identifier nodes in node
function collectIdentifiers(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
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
