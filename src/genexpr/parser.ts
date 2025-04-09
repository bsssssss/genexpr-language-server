import path from 'path';
import Parser from 'tree-sitter';

const parser = new Parser();
const genexprPath = path.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr: Parser.Language = require(genexprPath);

parser.setLanguage(GenExpr);

const testCode = "out1 = cycle(60);";
const tree = parser.parse(testCode);

console.log(tree.rootNode.toString());
