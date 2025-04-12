import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import Parser from 'tree-sitter';
import { parser, treeManager } from './parser';

export enum TokenTypes {
  Function,
  Parameter,
  Variable,
  Constant
}

export enum TokenModifiers {
  Declaration,
  Definition,
  External
}

export const tokenTypesLegend = [
  'function',
  'parameter',
  'variable',
  'constant'
]

export const tokenModifiersLegend = [
  'declaration',
  'definition',
  'external'
]

const genConstants = [
  'samplerate'
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
    case 'function_declaration':
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
      // Gather the parameters definitions (as text) in an array
      const params: string[] = [];
      for (const paramNode of node.childrenForFieldName('parameters')) {
        if (paramNode.type === 'function_declaration_parameter') {
          params.push(paramNode.text);
        }
      }
      // Iterate through all children of the function body node
      for (const bodyNode of node.childrenForFieldName('body')) {
        // Collect all the identifiers nodes & iterate
        let identifiersInBody: Parser.SyntaxNode[] = [];
        if (bodyNode.type === 'expr_statement_list') {
          identifiersInBody = collectIdentifiers(bodyNode);
        }
        for (const identifierInBody of identifiersInBody) {
          // If the identifier (as text) is defined, add it as a parameter token
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
      const isParamDecl = node.firstChild?.text === 'Param';
      if (isParamDecl) {
        for (const child of node.children) {
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
      if (genConstants.includes(node.text)) {
        builder.push(
          node.startPosition.row,
          node.startPosition.column,
          node.text.length,
          TokenTypes.Constant,
          0
        )
      } 
  }
  // Recursively iterate through all children of rootNode
  for (const child of node.children) {
    traverseTree(child, builder);
  }
}

// Recursively look for all identifier nodes in a node and collect them in an array
function collectIdentifiers(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  let identifiers: Parser.SyntaxNode[] = [];
  if (node.type === 'identifier') {
    //console.log(`Found identifier: ${node.text}`)
    identifiers.push(node);
  }
  for (const child of node.children) {
    if (child) {
      identifiers = identifiers.concat(collectIdentifiers(child));
    }
  }
  return identifiers;
}
