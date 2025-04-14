import path from 'path';
import Parser from 'tree-sitter';
import { TextDocument } from 'vscode-languageserver-textdocument';

export const parser = new Parser();
const genexprPath = path.resolve("/Users/bss/Code/git/bsssssss/tree-sitter-genexpr");
const GenExpr: Parser.Language = require(genexprPath);
parser.setLanguage(GenExpr);
