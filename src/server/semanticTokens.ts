import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import Parser from 'tree-sitter';
import { parser, treeManager } from './parser';
import { genConstants, genObjects } from './genlib';

export enum TokenTypes {
  Function,
  Parameter,
  Variable,
  Constant,
}
export const tokenTypesLegend = [
  'function',
  'parameter',
  'variable',
  'constant'
]

export enum TokenModifiers {
  Declaration,
  Definition,
  External,
  Builtin
}
export const tokenModifiersLegend = [
  'declaration',
  'definition',
  'external',
  'builtin'
]

let genParams: string[] = []

export function getSemanticTokens(document: TextDocument) {
  const tree = parser.parse(document.getText());
  //const tree = treeManager.parseDocument(document);
  const builder = new SemanticTokensBuilder();

  genParams = [];
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
      for (const bodyNode of node.childrenForFieldName('body')) {
        // Collect all identifier nodes
        let identifiersInBody: Parser.SyntaxNode[] = [];
        if (bodyNode.type === 'expr_statement_list') {
          identifiersInBody = collectIdentifiers(bodyNode);
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
        }
      }
      break;

    case 'declaration':
      // Handle gen's external param declarations
      const isParamDecl = node.firstChild?.text === 'Param';
      if (isParamDecl) {
        for (const child of node.children) {
          // Tokenize parameters of Param declaration (min and max)
          if (child.type === 'call_member_expression') {
            child.children.filter(child => child.type === 'identifier')
              .forEach(param => {
                if (param.text === 'min' || param.text === 'max') {
                  builder.push(
                    param.startPosition.row,
                    param.startPosition.column,
                    param.text.length,
                    TokenTypes.Parameter,
                    0
                  )
                }
              })
          }
          // Tokenize name of Param declaration and add to global array
          else if (child.type === 'identifier') {
            builder.push(
              child.startPosition.row,
              child.startPosition.column,
              child.text.length,
              TokenTypes.Variable,
              1 << TokenModifiers.External
            )
            genParams.push(child.text);
          }
        }
      }
      break;

    case 'statement':
      // Tokenize references to declared Param names
      let ids = collectIdentifiers(node);
      ids.filter(id => genParams.includes(id.text))
        .forEach(id => {
          builder.push(
            id.startPosition.row,
            id.startPosition.column,
            id.text.length,
            TokenTypes.Variable,
            1 << TokenModifiers.External
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
      // Tokenize gen objects
      else {
        const isGenObj = node.parent?.childForFieldName('object') && genObjects.includes(node.text);
        if (isGenObj) {
          builder.push(
            node.startPosition.row,
            node.startPosition.column,
            node.text.length,
            TokenTypes.Function,
            1 << TokenModifiers.Builtin
          )
        }
      }
  }
  // Recursive call
  for (const child of node.children) {
    traverseTree(child, builder);
  }
}

// Recursively collect all identifier nodes
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
