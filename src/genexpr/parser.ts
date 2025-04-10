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

//const testCode = "out1 = cycle(60);";
const testFilePath = path.join(__dirname, "../../test/test.genexpr")
const testCode = fs.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);

//console.log(testCode);
//console.log(tree.rootNode.toString());

export function getSemanticTokens(text: string, tree: Parser.Tree) {
  const builder = new SemanticTokensBuilder();
  const lines: string[] = text.split('\n');

  function traverseTree(node: Parser.SyntaxNode) {
    switch (node.type) {
      case "function_declaration":
        const params: string[] = [];

        for (const child of node.children) {
          if (child.type === 'identifier') {
            const str = getTextAtNode(child);
            console.log(`\nFunction name: ${str}`);
          }
          else if (child.type === 'function_declaration_parameter') {
            const str = getTextAtNode(child);
            params.push(str);
          }
        }
        console.log(`Parameters: ${params.toString()}`);
        const bodyChildren = node.childrenForFieldName('body');
        console.log(`The body:\n${bodyChildren.toString()}`);
        
        for (const bodyChild of bodyChildren) {
          if (bodyChild.type === 'expr_statement_list') {
            for (const exprChild of bodyChild.children) {
              console.log(`Expr child: ${exprChild}`);
            }
          }

        }
        break;
    }
    // Recursively iterate through all children of rootNode
    for (const child of node.children) {
      traverseTree(child);
    }

  }
  // Start at root node
  traverseTree(tree.rootNode);

  // Get the matching string of an indentifier node
  function getTextAtNode(node: Parser.SyntaxNode) {
    const line = node.startPosition.row;
    const startChar = node.startPosition.column;
    const endChar = node.endPosition.column;
    // Get the string matching the identifier
    const str = lines[line].slice(startChar, endChar);
    return str;
  }

  return builder.build();
}

getSemanticTokens(testCode, tree);
