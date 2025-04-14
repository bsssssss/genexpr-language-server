import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import Parser from 'tree-sitter';
import { parser } from './parser';
import { genConstants, genObjects, genObjectsRef } from './genlib';

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

export function getSemanticTokens(document: TextDocument) {
  const tree = parser.parse(document.getText());
  const builder = new SemanticTokensBuilder();

  // Start at root node
  traverseTree(tree.rootNode, builder);
  return builder.build();
}

function traverseTree(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {

  // Recursive call
  for (const child of node.children) {
    traverseTree(child, builder);
  }
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
