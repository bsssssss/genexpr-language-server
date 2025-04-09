import path from 'path';
import fs from 'fs';
import Parser from 'tree-sitter';
import { SemanticTokensBuilder } from 'vscode-languageserver/node';

const parser = new Parser();
const genexprPath = path.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr: Parser.Language = require(genexprPath);

parser.setLanguage(GenExpr);

//const testCode = "out1 = cycle(60);";
const testFilePath = path.join(__dirname, "../../test/test.genexpr")
const testCode = fs.readFileSync(testFilePath).toString();
const tree = parser.parse(testCode);

console.log(testCode);

console.log(tree.rootNode.toString());

//function getSemanticTokens
