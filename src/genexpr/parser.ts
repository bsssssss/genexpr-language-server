import path from 'path';
import fs from 'fs';
import Parser from 'tree-sitter';
import { SemanticTokensBuilder } from 'vscode-languageserver/node';

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

const testFilePath = path.join(__dirname, "../../test/test.genexpr")
const testCode = fs.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);

/////////////////////////////////////////////////////////////////////////////////

export function getSemanticTokens(text: string, tree: Parser.Tree) {
  const builder = new SemanticTokensBuilder();
  // Start at root node
  traverseTree(tree.rootNode, text, builder);
  return builder.build();
}

function traverseTree(node: Parser.SyntaxNode, text: string, builder: SemanticTokensBuilder) {
  if (node.type === 'function_declaration') {
    const params: string[] = [];
    for (const paramNode of node.childrenForFieldName('parameters')) {
      if (paramNode.type === 'function_declaration_parameter') {
        params.push(paramNode.text);
      }
    }
    console.log(`Params: ${params.toString()}`);

    for (const bodyNode of node.childrenForFieldName('body')) {
      if (bodyNode.type === 'expr_statement_list') {
        console.log(`Body:\n${bodyNode.text}`);
      }
    }
  }

  // Recursively iterate through all children of rootNode
  for (const child of node.children) {
    traverseTree(child, text, builder);
  }
}

getSemanticTokens(testCode, tree);
