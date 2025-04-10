import path from 'path';
import fs from 'fs';
import Parser from 'tree-sitter';
import { SemanticTokensBuilder } from 'vscode-languageserver/node';

export enum TokenTypes {
  Parameter
}

//export enum TokenModifiers {
//  Declaration,
//  Definition
//}

export const tokenTypesLegend = [
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

  function traverseNode(node: Parser.SyntaxNode) {
    const startPos = node.startPosition;
    const endPos = node.endPosition;

    switch (node.type) {
      case "function_declaration":
        const name = node.childForFieldName('name');
        if (name) {
          const nameStr = identifierToString(name);
          console.log(`Function name: ${nameStr}`);
        }

        const params = node.childrenForFieldName('parameters');
        const paramsStr: string[] = [];
        if (params) {
          for (const param of params) {
            const paramName = identifierToString(param);
            if (paramName !== ',') {
              console.log(`Param: ${paramName}`);
              paramsStr.push(paramName);
            }
          }
        }
      break;
      // TODO: identify function decl params with this 
      //       and handle their use in the body
      case 'identifier':
        const parent = node.parent;
        console.log(parent?.type);
    }

    // Recursively iterate through all children of rootNode
    for (const child of node.children) {
      traverseNode(child);
    }
  }
  // Start at root node
  traverseNode(tree.rootNode);

  // Get the matching string of an indentifier node
  function identifierToString(node: Parser.SyntaxNode) {
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
