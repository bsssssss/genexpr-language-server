import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import Parser from 'tree-sitter';
import { parser, treeManager } from './parser';
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

let genParams: string[] = []
let genSpecialVars: string[] = []

export function getSemanticTokens(document: TextDocument) {
  const tree = parser.parse(document.getText());
  //const tree = treeManager.parseDocument(document);
  const builder = new SemanticTokensBuilder();

  genParams = [];
  genSpecialVars = [];
  // Start at root node
  traverseTree(tree.rootNode, builder);
  return builder.build();
}

function traverseTree(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {
  switch (node.type) {
    // Handle function definitions
    case 'function_declaration':
      // Tokenize function definition name
      const funcName = node.childForFieldName('name');
      if (funcName) {
        builder.push(
          funcName.startPosition.row,
          funcName.startPosition.column,
          funcName.text.length,
          TokenTypes.Function,
          1 << TokenModifiers.Definition
        )
      }
      // Collect parameters definition as text
      const params: string[] = [];
      for (const paramNode of node.childrenForFieldName('parameters')) {
        if (paramNode.type === 'function_declaration_parameter') {
          params.push(paramNode.text);
        }
      }
      // Iterate through all children of function body node
      const bodyNode = node.childForFieldName('body');
      const typeSpecifiersNames: string[] = [];
      if (bodyNode) {
        for (const body of bodyNode.children) {
          // collect special objects names
          if (body.type === 'declaration') {
            body.children.forEach(x => {
              if (x.type === 'identifier') {
                typeSpecifiersNames.push(x.text);
              }
            })
          }
          // Collect all identifier nodes in statements
          let identifiersInBody: Parser.SyntaxNode[] = [];
          if (body.type === 'expr_statement_list') {
            identifiersInBody = collectIdentifiers(body);
          }
          // Iterate through them
          for (const identifierInBody of identifiersInBody) {
            // Tokenize parameter if defined
            if (params.includes(identifierInBody.text)) {
              builder.push(
                identifierInBody.startPosition.row,
                identifierInBody.startPosition.column,
                identifierInBody.text.length,
                TokenTypes.Parameter,
                0
              )
            }
            // Tokenize references to special variable names
            // Seems to push multiple times per variable in a if statement 
            else if (typeSpecifiersNames.includes(identifierInBody.text)) {
              //console.log(`Found identifier matching special var: ${identifierInBody.text}`)
              builder.push(
                identifierInBody.startPosition.row,
                identifierInBody.startPosition.column,
                identifierInBody.text.length,
                TokenTypes.Variable,
                1 << TokenModifiers.Special
              )
            }
          }
        }
      }
      break;

    case 'declaration':
      // Handle gen's 'special' objects declarations (ref in genlib.ts)
      const isSpecial = node.firstChild?.type === 'type_specifier';
      const specialType = node.firstChild?.text;
      if (isSpecial) {
        for (const child of node.children) {
          // Tokenize names of special declarations and add to global array
          if (child.type === 'identifier') {
            builder.push(
              child.startPosition.row,
              child.startPosition.column,
              child.text.length,
              TokenTypes.Variable,
              1 << TokenModifiers.Special
            )
            genSpecialVars.push(child.text);
          }
          // Tokenize attributes
          // TODO: check if attribute is listed for this object
          else if (child.type === 'call_member_expression') {
            child.children.filter(child => child.type === 'identifier')
              .forEach(attr => {
                builder.push(
                  attr.startPosition.row,
                  attr.startPosition.column,
                  attr.text.length,
                  TokenTypes.Attribute,
                  0
                )
              })
          }
        }
      }
      break;

    case 'statement':
      // Tokenize references to declared Special object names
      let ids = collectIdentifiers(node);
      ids.filter(id => genSpecialVars.includes(id.text))
        .forEach(id => {
          builder.push(
            id.startPosition.row,
            id.startPosition.column,
            id.text.length,
            TokenTypes.Variable,
            1 << TokenModifiers.Special
          )
        })
      break;

    case 'identifier':
      // Tokenize builtin constants
      if (genConstants.includes(node.text)) {
        builder.push(
          node.startPosition.row,
          node.startPosition.column,
          node.text.length,
          TokenTypes.Constant,
          0
        )
      }
      // Tokenize gen objects if listed in genlib.ts
      const isGenObj = node.parent?.childForFieldName('object') && (genObjects.has(node.text) || genObjectsRef.includes(node.text));
      if (isGenObj) {
        builder.push(
          node.startPosition.row,
          node.startPosition.column,
          node.text.length,
          TokenTypes.Object,
          1 << TokenModifiers.Builtin
        )
      }
  }
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
