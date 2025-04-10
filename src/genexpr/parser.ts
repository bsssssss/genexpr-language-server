import path from 'path';
import fs from 'fs';
import Parser from 'tree-sitter';
import { SemanticTokensBuilder } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export enum TokenTypes {
  Function,
  Parameter
}

export enum TokenModifiers {
  Declaration,
  Definition
}

export const tokenTypesLegend = [
  'function',
  'parameter'
]

const parser = new Parser();
const genexprPath = path.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr: Parser.Language = require(genexprPath);
parser.setLanguage(GenExpr);

//const testFilePath = path.join(__dirname, "../../test/test.genexpr")
//const testCode = fs.readFileSync(testFilePath).toString();

/////////////////////////////////////////////////////////////////////////////////

export function getSemanticTokens(document: TextDocument) {
  const tree = parser.parse(document.getText());
  const builder = new SemanticTokensBuilder();
  // Start at root node
  traverseTree(tree.rootNode, builder);
  return builder.build();
}

function traverseTree(node: Parser.SyntaxNode, builder: SemanticTokensBuilder) {
  if (node.type === 'function_declaration') {
    const params: string[] = [];
    for (const paramNode of node.childrenForFieldName('parameters')) {
      if (paramNode.type === 'function_declaration_parameter') {
        params.push(paramNode.text);
      }
    }
    //console.log(`Params: ${params.toString()}`);

    for (const bodyNode of node.childrenForFieldName('body')) {
      let identifiersInBody: Parser.SyntaxNode[] = [];
      if (bodyNode.type === 'expr_statement_list') {
        identifiersInBody = collectIdentifiers(bodyNode);
      }

      for (const identifierInBody of identifiersInBody) {
        if (params.includes(identifierInBody.text)) {
          //console.log(`Found match in body: ${identifierInBody.text}`);
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
  }
  // Recursively iterate through all children of rootNode
  for (const child of node.children) {
    traverseTree(child, builder);
  }
}

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

//getSemanticTokens(testCode, tree);
